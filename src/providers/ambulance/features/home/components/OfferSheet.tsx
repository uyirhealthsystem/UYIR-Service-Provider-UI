import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { emergencyLabel, pickupAddress, secondsUntil } from "../../../domain/trip";
import { colors, radius, spacing, typography } from "../../../theme";
import type { Offer, ServiceType } from "../../../types";
import { Badge, Button } from "../../../ui/components";
import { sheetStyles } from "./sheetStyles";

// How long the server gives a driver to answer.
const OFFER_WINDOW_SECONDS = 45;
const URGENT_SECONDS = 10;

type Props = {
  offer: Offer;
  serviceType: ServiceType;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onExpired: () => void;
};

export default function OfferSheet({
  offer,
  serviceType,
  loading,
  onAccept,
  onReject,
  onExpired,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(offer.expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const left = secondsUntil(offer.expiresAt);
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        onExpired();
      }
    }, 1000);
    return () => clearInterval(timer);
    // The sheet is keyed by booking, so one timer runs per offer.
  }, [offer.expiresAt]);

  const isEmergency = offer.type === "EMERGENCY";
  const urgent = secondsLeft <= URGENT_SECONDS;
  const timerColor = urgent ? colors.red : colors.blue;
  const remaining = Math.min(1, secondsLeft / OFFER_WINDOW_SECONDS);
  const reason =
    emergencyLabel(offer.emergencyType) ??
    (serviceType === "AMBULANCE" ? "Ambulance transport" : "Auto transport");

  return (
    <View style={sheetStyles.sheet}>
      <View style={sheetStyles.headerRow}>
        <View style={sheetStyles.grow}>
          <Badge
            label={isEmergency ? "Emergency" : "Scheduled"}
            tone={isEmergency ? "danger" : "info"}
          />
          <Text style={styles.title}>New booking request</Text>
        </View>
        <View
          style={styles.timer}
          accessibilityRole="timer"
          accessibilityLabel={`${secondsLeft} seconds left to respond`}
        >
          <Text style={[styles.timerValue, { color: timerColor }]}>{secondsLeft}</Text>
          <Text style={typography.caption}>sec</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.trackFill,
            { width: `${remaining * 100}%`, backgroundColor: timerColor },
          ]}
        />
      </View>

      <Detail icon="location" text={pickupAddress(offer.pickup)} />
      {offer.distanceKm != null ? (
        <Detail icon="navigate" text={`${offer.distanceKm.toFixed(1)} km from you`} />
      ) : null}
      <Detail icon="medical" text={reason} />

      <View style={sheetStyles.actions}>
        <Button
          title="Decline"
          variant="secondary"
          disabled={loading}
          onPress={onReject}
          style={sheetStyles.grow}
        />
        <Button
          title="Accept"
          icon="checkmark"
          loading={loading}
          onPress={onAccept}
          style={styles.accept}
        />
      </View>
    </View>
  );
}

function Detail({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text numberOfLines={2} style={styles.detailText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.heading, marginTop: spacing.sm },
  timer: { alignItems: "center", minWidth: 52 },
  timerValue: { fontSize: 28, lineHeight: 32, fontWeight: "700" },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  trackFill: { height: "100%", borderRadius: radius.pill },
  detail: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailText: { ...typography.label, fontWeight: "500", flex: 1 },
  accept: { flex: 2 },
});
