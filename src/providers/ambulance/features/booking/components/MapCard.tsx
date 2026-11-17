import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import {
  getOpenSourceRoute,
  type Coordinate,
  type RouteStep,
} from "../../../api/routes";

type Props = {
  type: "driver" | "patient" | "hospital";
  title: string;
  subtitle: string;
  destination?: Coordinate | null;
  driverLocation?: Coordinate | null;
  fullScreen?: boolean;
};

type RouteData = {
  coordinates: Coordinate[];
  steps: RouteStep[];
  distanceKm: number;
  durationMinutes: number;
};

function bearingBetween(from: Coordinate, to: Coordinate): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const toDegrees = (value: number) => (value * 180) / Math.PI;
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const y = Math.sin(deltaLongitude) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLongitude);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function distanceMeters(from: Coordinate, to: Coordinate): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const lat1 = radians(from.latitude);
  const lat2 = radians(to.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function turnIcon(
  modifier: string,
  maneuverType: string,
): keyof typeof Ionicons.glyphMap {
  const value = `${modifier} ${maneuverType}`.toLowerCase();
  if (value.includes("uturn")) return "return-up-back";
  if (value.includes("left")) return "arrow-undo";
  if (value.includes("right")) return "arrow-redo";
  if (value.includes("roundabout") || value.includes("rotary")) return "sync";
  return "arrow-up";
}

export default function MapCard({
  type,
  title,
  subtitle,
  destination,
  driverLocation,
  fullScreen = false,
}: Props) {
  const BLUE = "#1473E6";
  const GREEN = "#17B26A";
  const RED = "#E5484D";
  const TEXT = "#10233F";
  const MUTED = "#6B7890";

  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (driverLocation && destination) {
      mapRef.current.fitToCoordinates([driverLocation, destination], {
        edgePadding: {
          top: 155,
          right: 42,
          bottom: fullScreen ? 260 : 90,
          left: 42,
        },
        animated: true,
      });
      return;
    }

    if (driverLocation) {
      const region: Region = {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      };
      mapRef.current.animateToRegion(region, 500);
    }
  }, [
    destination?.latitude,
    destination?.longitude,
    driverLocation?.latitude,
    driverLocation?.longitude,
    fullScreen,
  ]);

  useEffect(() => {
    let active = true;

    async function loadRoute() {
      if (!driverLocation || !destination) {
        setRouteData(null);
        return;
      }

      setLoadingRoute(true);
      try {
        const route = await getOpenSourceRoute(driverLocation, destination);
        if (!active) return;
        setRouteData(route as RouteData | null);
      } catch (error) {
        console.log("AMBULANCE MAP ROUTE ERROR:", error);
        if (active) setRouteData(null);
      } finally {
        if (active) setLoadingRoute(false);
      }
    }

    void loadRoute();
    return () => {
      active = false;
    };
  }, [
    destination?.latitude,
    destination?.longitude,
    driverLocation?.latitude,
    driverLocation?.longitude,
  ]);

  const routeCoordinates = routeData?.coordinates || [];
  const routeSteps = routeData?.steps || [];
  const nextStep = useMemo(() => {
    if (!driverLocation || routeCoordinates.length < 2) return null;

    let nearestRouteIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    routeCoordinates.forEach((coordinate, index) => {
      const distance = distanceMeters(driverLocation, coordinate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestRouteIndex = index;
      }
    });

    return (
      routeSteps.find(
        (step) =>
          step.routeIndex > nearestRouteIndex &&
          !["depart", "arrive"].includes(step.maneuverType.toLowerCase()),
      ) ||
      routeSteps.find(
        (step) =>
          !["depart", "arrive"].includes(step.maneuverType.toLowerCase()),
      ) ||
      null
    );
  }, [
    driverLocation?.latitude,
    driverLocation?.longitude,
    routeCoordinates,
    routeSteps,
  ]);

  const distanceToTurn = useMemo(() => {
    if (!driverLocation || !nextStep || routeCoordinates.length < 2)
      return null;

    let nearestRouteIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    routeCoordinates.forEach((coordinate, index) => {
      const distance = distanceMeters(driverLocation, coordinate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestRouteIndex = index;
      }
    });

    const targetIndex = Math.max(
      nearestRouteIndex,
      Math.min(nextStep.routeIndex, routeCoordinates.length - 1),
    );
    let totalDistance = 0;
    for (let index = nearestRouteIndex; index < targetIndex; index += 1) {
      totalDistance += distanceMeters(
        routeCoordinates[index],
        routeCoordinates[index + 1],
      );
    }
    return totalDistance;
  }, [
    driverLocation?.latitude,
    driverLocation?.longitude,
    nextStep,
    routeCoordinates,
  ]);

  const directionMarkers = useMemo(() => {
    if (routeCoordinates.length < 10) return [];
    const markerCount = Math.min(
      8,
      Math.max(3, Math.floor(routeCoordinates.length / 18)),
    );
    const markers: { coordinate: Coordinate; rotation: number; key: string }[] =
      [];
    for (let markerIndex = 1; markerIndex <= markerCount; markerIndex += 1) {
      const index = Math.floor(
        ((routeCoordinates.length - 1) * markerIndex) / (markerCount + 1),
      );
      const current = routeCoordinates[index];
      const next =
        routeCoordinates[Math.min(index + 1, routeCoordinates.length - 1)];
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

  const driverHeading =
    routeCoordinates.length > 1
      ? bearingBetween(routeCoordinates[0], routeCoordinates[1])
      : 0;
  const destinationColor = type === "hospital" ? GREEN : RED;
  const destinationIcon = type === "hospital" ? "business" : "location";

  return (
    <View
      style={{
        height: fullScreen ? "100%" : 330,
        flex: fullScreen ? 1 : undefined,
        borderRadius: fullScreen ? 0 : 18,
        overflow: "hidden",
        marginTop: fullScreen ? 0 : 14,
        borderWidth: fullScreen ? 0 : 1,
        borderColor: "#D3E0EC",
        backgroundColor: "#DCEAF5",
      }}
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: driverLocation?.latitude ?? 13.0827,
          longitude: driverLocation?.longitude ?? 80.2707,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass
        toolbarEnabled={false}
        loadingEnabled
      >
        {driverLocation ? (
          <Marker
            coordinate={driverLocation}
            title="Your location"
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={driverHeading}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: BLUE,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                elevation: 5,
              }}
            >
              <Ionicons name="navigate" size={23} color="#FFFFFF" />
            </View>
          </Marker>
        ) : null}

        {destination ? (
          <Marker
            coordinate={destination}
            title={title}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: destinationColor,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                elevation: 4,
              }}
            >
              <Ionicons
                name={destinationIcon as any}
                size={19}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        ) : null}

        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={BLUE}
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
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: BLUE,
              }}
            >
              <Ionicons name="arrow-up" size={14} color={BLUE} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          top: 12,
          backgroundColor: "#FFFFFF",
          borderRadius: 13,
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          elevation: 4,
        }}
      >
        <Ionicons name="navigate" size={20} color={BLUE} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ color: TEXT, fontSize: 11, fontWeight: "900" }}>
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={{ color: MUTED, fontSize: 9, marginTop: 2 }}
          >
            {subtitle}
          </Text>
        </View>
        {loadingRoute ? <ActivityIndicator size="small" color={BLUE} /> : null}
      </View>

      {destination && driverLocation && routeData && nextStep ? (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 72,
            backgroundColor: "#10233F",
            borderRadius: 14,
            paddingHorizontal: 13,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            elevation: 5,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={turnIcon(nextStep.modifier, nextStep.maneuverType)}
              size={24}
              color={BLUE}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 11 }}>
            <Text
              style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900" }}
              numberOfLines={2}
            >
              {nextStep.instruction}
            </Text>
            {distanceToTurn !== null ? (
              <Text style={{ color: "#C9D9EF", fontSize: 11, marginTop: 4 }}>
                In {formatDistance(distanceToTurn)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {destination && driverLocation && !loadingRoute && !routeData ? (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 72,
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 11,
            elevation: 3,
          }}
        >
          <Text style={{ color: MUTED, fontSize: 11 }}>
            Route guidance is temporarily unavailable. Check your internet
            connection.
          </Text>
        </View>
      ) : null}

      {routeData ? (
        <View
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            backgroundColor: "#FFFFFF",
            borderRadius: 13,
            paddingHorizontal: 13,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            elevation: 4,
          }}
        >
          <Ionicons name="time-outline" size={17} color={GREEN} />
          <Text
            style={{
              color: TEXT,
              fontSize: 13,
              fontWeight: "900",
              marginLeft: 6,
            }}
          >
            {routeData.durationMinutes} min
          </Text>
          <View
            style={{
              width: 1,
              height: 18,
              backgroundColor: "#DCE4EE",
              marginHorizontal: 10,
            }}
          />
          <Ionicons name="navigate-outline" size={16} color={BLUE} />
          <Text
            style={{
              color: MUTED,
              fontSize: 11,
              fontWeight: "700",
              marginLeft: 5,
            }}
          >
            {routeData.distanceKm.toFixed(1)} km
          </Text>
        </View>
      ) : null}
    </View>
  );
}
