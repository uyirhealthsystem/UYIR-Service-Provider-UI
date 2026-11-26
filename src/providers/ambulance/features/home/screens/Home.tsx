import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ambulanceTypeLabel, toCoordinate, tripPhase } from "../../../domain/trip";
import { colors, radius, shadow, spacing, typography } from "../../../theme";
import type { ServiceType } from "../../../types";
import MapCard from "../../booking/components/MapCard";
import IdleSheet from "../components/IdleSheet";
import OfferSheet from "../components/OfferSheet";
import TripSheet from "../components/TripSheet";
import { useDriverDashboard } from "../hooks/useDriverDashboard";
import { useDriverLocation } from "../hooks/useDriverLocation";

type ScreenProps = { route?: any };

export default function Home({ route }: ScreenProps) {
  const serviceType: ServiceType = route?.params?.serviceType || "AMBULANCE";
  const [sheetHeight, setSheetHeight] = useState(0);

  const dashboard = useDriverDashboard();
  const { profile, online, offer, trip, loading } = dashboard;

  const phase = trip ? tripPhase(trip.status) : null;
  const onActiveTrip = phase !== null && phase !== "DROPPED";
  const { location } = useDriverLocation(online || onActiveTrip);

  const headedToHospital = phase === "TO_HOSPITAL";
  const destination =
    trip && onActiveTrip ? toCoordinate(headedToHospital ? trip.drop : trip.pickup) : null;

  const vehicle = profile
    ? `${profile.plateNumber} · ${ambulanceTypeLabel(profile.ambulanceType)}`
    : "Ambulance";

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Overlays are placed inside this view so they stay below the status bar. */}
      <View style={styles.page}>
      <MapCard
        destination={destination}
        destinationKind={headedToHospital ? "hospital" : "patient"}
        driverLocation={location}
        bottomInset={sheetHeight}
        missingDestination={onActiveTrip && !destination}
      />

      <View style={styles.topBar}>
        <View style={styles.vehicleIcon}>
          <MaterialCommunityIcons name="ambulance" size={22} color={colors.blue} />
        </View>
        <View style={styles.vehicle}>
          <Text style={typography.label} numberOfLines={1}>
            {profile?.fullName || "Driver"}
          </Text>
          <Text style={typography.caption} numberOfLines={1}>
            {vehicle}
          </Text>
        </View>
        <Text style={[styles.status, online ? styles.statusOnline : null]}>
          {online ? "Online" : "Offline"}
        </Text>
        <Switch
          value={online}
          disabled={loading || onActiveTrip}
          onValueChange={dashboard.changeAvailability}
          accessibilityLabel="Available for bookings"
          trackColor={{ false: colors.border, true: colors.green }}
          thumbColor={colors.white}
        />
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.dock} pointerEvents="box-none">
        <View onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}>
          {trip ? (
            <TripSheet
              key={trip.id}
              trip={trip}
              loading={loading}
              onArrived={dashboard.markArrived}
              onConfirmPickup={dashboard.confirmPickup}
              onDropped={dashboard.markDropped}
              onFinish={dashboard.finishTrip}
            />
          ) : offer ? (
            <OfferSheet
              key={offer.bookingId}
              offer={offer}
              serviceType={serviceType}
              loading={loading}
              onAccept={dashboard.acceptOffer}
              onReject={dashboard.rejectOffer}
              onExpired={dashboard.expireOffer}
            />
          ) : (
            <IdleSheet
              online={online}
              loading={loading}
              onGoOnline={() => dashboard.changeAvailability(true)}
            />
          )}
        </View>
      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...shadow.floating,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicle: { flex: 1 },
  status: { ...typography.caption, fontWeight: "600" },
  statusOnline: { color: colors.green },
  dock: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
