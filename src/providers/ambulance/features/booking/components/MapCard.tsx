import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { getOpenSourceRoute, type RouteData } from "../../../api/routes";
import {
  bearingBetween,
  distanceMeters,
  formatDistance,
  nearestIndex,
  pathDistanceMeters,
} from "../../../domain/geo";
import { colors, radius, shadow, spacing, typography } from "../../../theme";
import type { Coordinate } from "../../../types";
import { IconButton } from "../../../ui/components";

// Location updates arrive every few seconds; the route only needs refreshing after real movement.
const ROUTE_REFRESH_METERS = 75;
// Closer than this, there is no route to draw: the ambulance is already there.
const ARRIVED_METERS = 60;
const DEFAULT_CENTER = { latitude: 13.0827, longitude: 80.2707 };
const IGNORED_MANEUVERS = ["depart", "arrive"];
// Keeps the route clear of the top bar and the turn banner.
const TOP_OVERLAY_HEIGHT = 190;

type Props = {
  destination: Coordinate | null;
  destinationKind: "patient" | "hospital";
  driverLocation: Coordinate | null;
  bottomInset: number;
  /** On a trip, but the booking has no location for the next stop (e.g. no hospital chosen). */
  missingDestination?: boolean;
};

function turnIcon(modifier: string, maneuverType: string): keyof typeof Ionicons.glyphMap {
  const value = `${modifier} ${maneuverType}`.toLowerCase();
  if (value.includes("uturn")) return "return-up-back";
  if (value.includes("left")) return "arrow-undo";
  if (value.includes("right")) return "arrow-redo";
  if (value.includes("roundabout") || value.includes("rotary")) return "sync";
  return "arrow-up";
}

export default function MapCard({
  destination,
  destinationKind,
  driverLocation,
  bottomInset,
  missingDestination = false,
}: Props) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [following, setFollowing] = useState(true);
  const [recenterCount, setRecenterCount] = useState(0);
  const mapRef = useRef<MapView | null>(null);
  const routeRequest = useRef(0);
  const routedFrom = useRef<{ origin: Coordinate; destination: Coordinate } | null>(null);

  useEffect(() => {
    if (!mapRef.current || !following || !driverLocation) return;

    if (destination) {
      mapRef.current.fitToCoordinates([driverLocation, destination], {
        edgePadding: {
          top: TOP_OVERLAY_HEIGHT,
          right: 48,
          bottom: bottomInset + 48,
          left: 48,
        },
        animated: true,
      });
      return;
    }

    mapRef.current.animateToRegion(
      { ...driverLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500,
    );
  }, [
    destination?.latitude,
    destination?.longitude,
    driverLocation?.latitude,
    driverLocation?.longitude,
    bottomInset,
    following,
    recenterCount,
  ]);

  useEffect(() => {
    if (!driverLocation || !destination) {
      routeRequest.current += 1;
      routedFrom.current = null;
      setRouteData(null);
      setLoadingRoute(false);
      return;
    }

    const previous = routedFrom.current;
    const sameDestination =
      previous?.destination.latitude === destination.latitude &&
      previous?.destination.longitude === destination.longitude;
    if (
      previous &&
      sameDestination &&
      distanceMeters(previous.origin, driverLocation) < ROUTE_REFRESH_METERS
    ) {
      return;
    }

    routedFrom.current = { origin: driverLocation, destination };
    routeRequest.current += 1;
    const request = routeRequest.current;
    setLoadingRoute(true);

    getOpenSourceRoute(driverLocation, destination).then((route) => {
      if (request !== routeRequest.current) return;
      setRouteData(route);
      setLoadingRoute(false);
      // Try again on the next location update if the route failed.
      if (!route) routedFrom.current = null;
    });
  }, [
    destination?.latitude,
    destination?.longitude,
    driverLocation?.latitude,
    driverLocation?.longitude,
  ]);

  useEffect(
    () => () => {
      routeRequest.current += 1;
      routedFrom.current = null;
    },
    [],
  );

  const routeCoordinates = routeData?.coordinates ?? [];
  const routeSteps = routeData?.steps ?? [];

  const routeProgressIndex = useMemo(() => {
    if (!driverLocation || routeCoordinates.length < 2) return null;
    return nearestIndex(routeCoordinates, driverLocation);
  }, [driverLocation?.latitude, driverLocation?.longitude, routeCoordinates]);

  const nextStep = useMemo(() => {
    if (routeProgressIndex === null) return null;
    const turns = routeSteps.filter(
      (step) => !IGNORED_MANEUVERS.includes(step.maneuverType.toLowerCase()),
    );
    return turns.find((step) => step.routeIndex > routeProgressIndex) ?? null;
  }, [routeProgressIndex, routeSteps]);

  const distanceToTurn = useMemo(() => {
    if (routeProgressIndex === null || !nextStep) return null;
    const targetIndex = Math.max(
      routeProgressIndex,
      Math.min(nextStep.routeIndex, routeCoordinates.length - 1),
    );
    return pathDistanceMeters(routeCoordinates, routeProgressIndex, targetIndex);
  }, [routeProgressIndex, nextStep, routeCoordinates]);

  const directionMarkers = useMemo(() => {
    if (routeCoordinates.length < 10) return [];
    const markerCount = Math.min(8, Math.max(3, Math.floor(routeCoordinates.length / 18)));
    const markers: { coordinate: Coordinate; rotation: number; key: string }[] = [];
    for (let markerIndex = 1; markerIndex <= markerCount; markerIndex += 1) {
      const index = Math.floor(((routeCoordinates.length - 1) * markerIndex) / (markerCount + 1));
      const current = routeCoordinates[index];
      const next = routeCoordinates[Math.min(index + 1, routeCoordinates.length - 1)];
      if (current && next) {
        markers.push({
          coordinate: current,
          rotation: bearingBetween(current, next),
          key: `direction-${index}`,
        });
      }
    }
    return markers;
  }, [routeCoordinates]);

  const isHospital = destinationKind === "hospital";
  const destinationName = isHospital ? "Hospital drop-off" : "Patient pickup";
  const atDestination =
    !!destination && !!driverLocation && distanceMeters(driverLocation, destination) < ARRIVED_METERS;

  let bannerTitle: string;
  if (atDestination) {
    bannerTitle = isHospital ? "You're at the hospital" : "You're at the patient pickup";
  } else if (nextStep) {
    bannerTitle = nextStep.instruction;
  } else if (routeData || loadingRoute) {
    bannerTitle = `Continue to ${destinationName.toLowerCase()}`;
  } else {
    bannerTitle = "Route unavailable. Tap Navigate for directions.";
  }

  function recenter() {
    setFollowing(true);
    setRecenterCount((count) => count + 1);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...(driverLocation ?? DEFAULT_CENTER),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        onPanDrag={() => setFollowing(false)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.blue}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {directionMarkers.map((marker) => (
          <Marker
            key={marker.key}
            coordinate={marker.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={marker.rotation}
            tracksViewChanges={false}
          >
            <View style={styles.directionMarker}>
              <Ionicons name="arrow-up" size={13} color={colors.blue} />
            </View>
          </Marker>
        ))}

        {destination ? (
          <Marker coordinate={destination} title={destinationName} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={[
                styles.destinationMarker,
                { backgroundColor: isHospital ? colors.green : colors.red },
              ]}
            >
              <Ionicons name={isHospital ? "business" : "person"} size={18} color={colors.white} />
            </View>
          </Marker>
        ) : null}

        {driverLocation ? (
          <Marker
            coordinate={driverLocation}
            title="Ambulance location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.ambulanceMarker}>
              <MaterialCommunityIcons name="ambulance" size={25} color={colors.white} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      {destination && driverLocation ? (
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            {loadingRoute && !routeData && !atDestination ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons
                name={
                  atDestination
                    ? "flag"
                    : nextStep
                      ? turnIcon(nextStep.modifier, nextStep.maneuverType)
                      : "navigate"
                }
                size={22}
                color={colors.white}
              />
            )}
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {bannerTitle}
            </Text>
            {routeData && !atDestination ? (
              <Text style={styles.bannerMeta}>
                {distanceToTurn !== null ? `In ${formatDistance(distanceToTurn)} · ` : ""}
                {routeData.durationMinutes} min · {routeData.distanceKm.toFixed(1)} km
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {missingDestination && !destination ? (
        <View style={[styles.banner, styles.bannerWarning]}>
          <View style={styles.bannerIcon}>
            <Ionicons name="alert-circle" size={22} color={colors.white} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {isHospital ? "No hospital set for this trip" : "No pickup location for this trip"}
            </Text>
            <Text style={styles.bannerMeta}>
              {isHospital
                ? "Ask the patient where to go, or find a nearby hospital."
                : "Call the patient for their location."}
            </Text>
          </View>
        </View>
      ) : null}

      {!driverLocation ? (
        <View style={styles.locating}>
          <ActivityIndicator size="small" color={colors.blue} />
          <Text style={typography.caption}>Finding ambulance location</Text>
        </View>
      ) : null}

      <IconButton
        icon={following ? "locate" : "locate-outline"}
        label="Center map on ambulance"
        color={colors.blue}
        onPress={recenter}
        style={[styles.recenter, { bottom: bottomInset + spacing.md }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted },
  map: { flex: 1 },
  ambulanceMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 5,
  },
  destinationMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 4,
  },
  directionMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    position: "absolute",
    top: 76,
    left: spacing.md,
    right: spacing.md,
    minHeight: 64,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadow.floating,
  },
  bannerWarning: { backgroundColor: colors.red },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 15, lineHeight: 20, fontWeight: "600", color: colors.white },
  bannerMeta: { fontSize: 12, lineHeight: 16, color: "#C4D0E0", marginTop: 2 },
  locating: {
    position: "absolute",
    top: 76,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...shadow.floating,
  },
  recenter: {
    position: "absolute",
    right: spacing.md,
    backgroundColor: colors.surface,
    ...shadow.floating,
  },
});
