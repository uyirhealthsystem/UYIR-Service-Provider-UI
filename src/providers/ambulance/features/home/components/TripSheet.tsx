import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  dropAddress,
  emergencyLabel,
  formatMoney,
  OTP_LENGTH,
  pickupAddress,
  toCoordinate,
  tripPhase,
  type TripPhase,
} from "../../../domain/trip";
import { colors, radius, spacing, typography } from "../../../theme";
import type { Booking } from "../../../types";
import { Badge, Button, IconButton } from "../../../ui/components";
import { callPhone, openNavigation, openNearbyHospitals } from "../externalApps";
import { sheetStyles } from "./sheetStyles";

type Props = {
  trip: Booking;
  loading: boolean;
  onArrived: () => void;
  onConfirmPickup: (otp: string) => void;
  onDropped: () => void;
  onFinish: () => void;
};

const PHASE_TITLES: Record<TripPhase, string> = {
  TO_PATIENT: "Heading to patient",
  AT_PATIENT: "Confirm pickup",
  TO_HOSPITAL: "Heading to hospital",
  DROPPED: "Trip complete",
};

const STEPS: { phase: TripPhase; label: string }[] = [
  { phase: "TO_PATIENT", label: "Pickup" },
  { phase: "AT_PATIENT", label: "Verify" },
  { phase: "TO_HOSPITAL", label: "Hospital" },
  { phase: "DROPPED", label: "Done" },
];

export default function TripSheet({
  trip,
  loading,
  onArrived,
  onConfirmPickup,
  onDropped,
  onFinish,
}: Props) {
  const [otp, setOtp] = useState("");
  const phase = tripPhase(trip.status);
  const headedToHospital = phase === "TO_HOSPITAL" || phase === "DROPPED";
  const destination = toCoordinate(headedToHospital ? trip.drop : trip.pickup);
  const reason = emergencyLabel(trip.emergencyType);

  if (phase === "DROPPED") {
    return (
      <View style={sheetStyles.sheet}>
        <Stepper phase={phase} />
        <View style={styles.complete}>
          <View style={styles.completeIcon}>
            <Ionicons name="checkmark" size={28} color={colors.green} />
          </View>
          <Text style={typography.heading}>{PHASE_TITLES.DROPPED}</Text>
          <Text style={styles.fareValue}>{formatMoney(trip.fare)}</Text>
          <Text style={typography.body}>Final fare. The patient pays through the app.</Text>
        </View>
        <Button title="Done" loading={loading} onPress={onFinish} />
      </View>
    );
  }

  return (
    <View style={sheetStyles.sheet}>
      <Stepper phase={phase} />

      <View style={[sheetStyles.headerRow, styles.header]}>
        <Text style={typography.heading}>{PHASE_TITLES[phase]}</Text>
        {reason ? <Badge label={reason} tone="danger" /> : null}
      </View>

      <View style={styles.contact}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.blue} />
        </View>
        <View style={sheetStyles.grow}>
          <Text style={typography.label} numberOfLines={1}>
            {trip.contactName || "Patient"}
          </Text>
          <Text numberOfLines={2} style={typography.body}>
            {headedToHospital ? dropAddress(trip.drop) : pickupAddress(trip.pickup)}
          </Text>
        </View>
        {trip.contactPhone ? (
          <IconButton
            icon="call"
            label={`Call ${trip.contactName || "patient"}`}
            color={colors.green}
            onPress={() => callPhone(trip.contactPhone as string)}
            style={styles.callButton}
          />
        ) : null}
      </View>

      {phase === "AT_PATIENT" ? (
        <View style={styles.otp}>
          <Text style={typography.body}>
            Ask the patient for their {OTP_LENGTH}-digit OTP to start the trip.
          </Text>
          <TextInput
            value={otp}
            onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            accessibilityLabel="Patient OTP"
            placeholder={"•".repeat(OTP_LENGTH)}
            placeholderTextColor={colors.muted}
            style={styles.otpInput}
          />
          <Button
            title="Verify and start trip"
            loading={loading}
            disabled={otp.length !== OTP_LENGTH}
            onPress={() => onConfirmPickup(otp)}
          />
        </View>
      ) : (
        <View style={sheetStyles.actions}>
          {destination ? (
            <Button
              title="Navigate"
              icon="navigate"
              variant="secondary"
              onPress={() => openNavigation(destination)}
              style={sheetStyles.grow}
            />
          ) : headedToHospital ? (
            <Button
              title="Find hospital"
              icon="search"
              variant="secondary"
              onPress={openNearbyHospitals}
              style={sheetStyles.grow}
            />
          ) : null}
          <Button
            title={phase === "TO_PATIENT" ? "I've arrived" : "Patient dropped"}
            icon="checkmark"
            loading={loading}
            onPress={phase === "TO_PATIENT" ? onArrived : onDropped}
            style={sheetStyles.grow}
          />
        </View>
      )}
    </View>
  );
}

function Stepper({ phase }: { phase: TripPhase }) {
  const current = STEPS.findIndex((step) => step.phase === phase);

  return (
    <View
      style={styles.stepper}
      accessibilityLabel={`Step ${current + 1} of ${STEPS.length}: ${STEPS[current].label}`}
    >
      {STEPS.map((step, index) => (
        <View key={step.phase} style={sheetStyles.grow}>
          <View style={[styles.stepBar, index <= current ? styles.stepBarDone : null]} />
          <Text style={[styles.stepLabel, index === current ? styles.stepLabelCurrent : null]}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: "row", gap: spacing.xs },
  stepBar: { height: 4, borderRadius: radius.pill, backgroundColor: colors.divider },
  stepBarDone: { backgroundColor: colors.blue },
  stepLabel: { ...typography.caption, marginTop: spacing.xs },
  stepLabelCurrent: { color: colors.blue, fontWeight: "700" },
  header: { marginTop: spacing.md },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  callButton: { backgroundColor: colors.greenSoft },
  otp: { marginTop: spacing.md, gap: spacing.md },
  otpInput: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 12,
    textAlign: "center",
  },
  complete: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  completeIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  fareValue: { ...typography.display },
});
