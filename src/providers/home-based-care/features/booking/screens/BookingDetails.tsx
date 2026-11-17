import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { acceptBooking, completeBooking, confirmBooking, getBooking, releaseBooking, startBooking } from "../../../api/bookings";
import { HbcApiError, errorMessage } from "../../../api/client";
import type { Booking, BookingStatus } from "../../../api/types";
import { Button, C, Card, DetailRow, ErrorBanner, Header, StatusPill } from "../../../components/ui";
import { dateTime, distance, patientName, rupees, serviceName } from "../../../utils/format";

const RELEASE_REASONS = ["Patient unreachable", "Schedule conflict", "Too far to travel"];

const STEPS: { status: BookingStatus; label: string; at: keyof Booking }[] = [
  { status: "ACCEPTED", label: "Accepted", at: "acceptedAt" },
  { status: "CONFIRMED", label: "Confirmed with patient", at: "confirmedAt" },
  { status: "PAID", label: "Patient paid", at: "paidAt" },
  { status: "IN_PROGRESS", label: "Visit started", at: "startedAt" },
  { status: "COMPLETED", label: "Completed", at: "completedAt" },
];
const ORDER: BookingStatus[] = ["PENDING", "ACCEPTED", "CONFIRMED", "PAID", "IN_PROGRESS", "COMPLETED"];

export default function BookingDetails({ route, navigation }: any) {
  const bookingId: string = route.params?.bookingId;
  const initial: Booking | undefined = route.params?.booking;

  const [booking, setBooking] = useState<Booking | null>(initial || null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [otp, setOtp] = useState("");
  const [releaseReason, setReleaseReason] = useState(RELEASE_REASONS[0]);

  // Pool bookings are not assigned to us yet, so GET /provider/bookings/{id} would 404.
  const inPool = booking?.status === "PENDING";

  const load = useCallback(async () => {
    if (!bookingId || (booking?.status ?? initial?.status) === "PENDING") return;
    setLoading(true);
    setError("");
    try {
      setBooking(await getBooking(bookingId));
    } catch (e) {
      setError(errorMessage(e, "Unable to load this booking."));
    } finally {
      setLoading(false);
    }
  }, [bookingId, booking?.status]);

  useEffect(() => { load(); }, [bookingId]);

  const run = async (key: string, action: () => Promise<Booking>, after?: (b: Booking) => void) => {
    setBusy(key);
    try {
      const updated = await action();
      setBooking(updated);
      setNote("");
      after?.(updated);
    } catch (e) {
      if (e instanceof HbcApiError && e.code === "BOOKING_UNAVAILABLE") {
        Alert.alert("Booking taken", "Another provider picked this booking first.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else if (e instanceof HbcApiError && e.status === 429) {
        Alert.alert("Too many attempts", "Too many wrong OTP attempts. Please wait a moment and try again.");
      } else if (e instanceof HbcApiError && e.status === 409) {
        Alert.alert("Booking changed", `${e.message}\n\nThe booking will be refreshed.`);
        load();
      } else {
        Alert.alert("Action failed", errorMessage(e));
      }
    } finally {
      setBusy("");
    }
  };

  const onAccept = () => run("accept", () => acceptBooking(bookingId));
  const onConfirm = () => run("confirm", () => confirmBooking(bookingId, note.trim() || undefined));
  const onRelease = () =>
    Alert.alert("Release booking?", `It goes back to the pool for other providers.\nReason: ${releaseReason}`, [
      { text: "Keep it", style: "cancel" },
      { text: "Release", style: "destructive", onPress: () => run("release", () => releaseBooking(bookingId, releaseReason), () => navigation.goBack()) },
    ]);
  const onStart = () => {
    if (!/^[0-9]{6}$/.test(otp)) return Alert.alert("Enter the OTP", "Ask the patient for their 6-digit visit OTP.");
    run("start", () => startBooking(bookingId, otp), () => setOtp(""));
  };
  const onComplete = () =>
    Alert.alert("Complete this visit?", "Mark the service as finished.", [
      { text: "Not yet", style: "cancel" },
      { text: "Complete", onPress: () => run("complete", () => completeBooking(bookingId, note.trim() || undefined)) },
    ]);

  const call = () => booking?.patient?.phone && Linking.openURL(`tel:${booking.patient.phone}`);
  const hasCoords = booking?.latitude != null && booking?.longitude != null;
  const directions = () => {
    if (!booking) return;
    const dest = hasCoords ? `${booking.latitude},${booking.longitude}` : encodeURIComponent([booking.address, booking.city, booking.pincode].filter(Boolean).join(", "));
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
  };

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <Header title="Booking" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          {error ? <ErrorBanner message={error} onRetry={load} /> : <Text style={{ color: C.muted }}>Loading booking…</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const s = booking.status;
  const prescriptions = booking.prescriptions || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <Header title="Booking" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={inPool ? undefined : <RefreshControl refreshing={loading} onRefresh={load} tintColor={C.blue} />}
        >
          <ErrorBanner message={error} onRetry={load} />

          {/* Summary */}
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: C.ink }}>{serviceName(booking)}</Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                  {booking.service?.durationMinutes ? `${booking.service.durationMinutes} min · ` : ""}{rupees(booking.amount)}
                </Text>
              </View>
              <StatusPill status={s} />
            </View>
            <DetailRow icon="calendar-outline" label="Scheduled" value={dateTime(booking.scheduledAt)} />
            {inPool ? (
              <>
                <DetailRow icon="navigate-outline" label="Distance" value={distance(booking.distanceKm)} />
                <DetailRow icon="business-outline" label="Area" value={[booking.city, booking.pincode].filter(Boolean).join(" · ")} />
              </>
            ) : null}
            {s === "CANCELLED" && booking.cancelReason ? <DetailRow icon="close-circle-outline" label="Cancel reason" value={booking.cancelReason} /> : null}
          </Card>

          {/* Patient — only after accept */}
          {!inPool ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ color: C.ink, fontWeight: "900", fontSize: 15 }}>Patient</Text>
              <DetailRow icon="person-outline" label="Name" value={patientName(booking)} />
              <DetailRow icon="call-outline" label="Phone" value={booking.patient?.phone} />
              <DetailRow icon="location-outline" label="Address" value={[booking.address, booking.city, booking.pincode].filter(Boolean).join(", ")} />
              {booking.notes ? <DetailRow icon="document-text-outline" label="Patient notes" value={booking.notes} /> : null}
              {s !== "COMPLETED" && s !== "CANCELLED" ? (
                <View style={{ flexDirection: "row", gap: 9, marginTop: 15 }}>
                  <Button title="Call" icon="call" variant="outline" onPress={call} disabled={!booking.patient?.phone} />
                  <Button title="Directions" icon="navigate" variant="outline" onPress={directions} />
                  {hasCoords ? <Button title="Map" icon="map" variant="outline" onPress={() => navigation.navigate("HomeCareMap", { booking })} /> : null}
                </View>
              ) : null}
            </Card>
          ) : (
            <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", backgroundColor: C.blueSoft, borderRadius: 12, padding: 12 }}>
              <Ionicons name="lock-closed-outline" size={16} color={C.blue} />
              <Text style={{ marginLeft: 8, color: C.ink, fontSize: 12, flex: 1 }}>Patient name, phone, address and prescriptions are shared after you accept.</Text>
            </View>
          )}

          {prescriptions.length ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ color: C.ink, fontWeight: "900", fontSize: 15 }}>Prescriptions</Text>
              {prescriptions.map((p, i) => (
                <View key={p.id || i} style={{ marginTop: 12, padding: 12, backgroundColor: C.bg, borderRadius: 12 }}>
                  <Text style={{ color: C.ink, fontWeight: "800" }}>{p.medicineName}</Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{[p.dosage, p.frequency, p.duration].filter(Boolean).join(" · ") || "—"}</Text>
                  {p.instructions ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{p.instructions}</Text> : null}
                  {p.documentUrl ? (
                    <Pressable onPress={() => Linking.openURL(p.documentUrl!)} style={{ marginTop: 6 }}>
                      <Text style={{ color: C.blue, fontWeight: "800", fontSize: 12 }}>View document</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </Card>
          ) : null}

          {/* Progress */}
          {!inPool && s !== "CANCELLED" ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ color: C.ink, fontWeight: "900", fontSize: 15, marginBottom: 4 }}>Progress</Text>
              {STEPS.map((step) => {
                const done = ORDER.indexOf(s) >= ORDER.indexOf(step.status);
                return (
                  <View key={step.status} style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                    <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={18} color={done ? C.green : "#C3CCDA"} />
                    <Text style={{ flex: 1, marginLeft: 9, color: done ? C.ink : C.muted, fontWeight: done ? "800" : "500", fontSize: 13 }}>{step.label}</Text>
                    <Text style={{ color: C.muted, fontSize: 11 }}>{done ? dateTime(booking[step.at] as string) : ""}</Text>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {/* Actions per status */}
          {s === "PENDING" ? (
            <View style={{ flexDirection: "row", marginTop: 16 }}>
              <Button title="Accept booking" icon="checkmark" onPress={onAccept} busy={busy === "accept"} />
            </View>
          ) : null}

          {s === "ACCEPTED" ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ color: C.ink, fontSize: 15, fontWeight: "900" }}>Call the patient to confirm</Text>
              <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
                Agree on the visit, then confirm. The patient pays after you confirm.
              </Text>
              <NoteInput value={note} onChange={setNote} placeholder="Note (optional), e.g. Spoke to patient" />
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <Button title="Confirm booking" onPress={onConfirm} busy={busy === "confirm"} disabled={!!busy} />
              </View>
              <Text style={{ color: C.ink, fontWeight: "800", fontSize: 13, marginTop: 18 }}>Can't take it?</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
                {RELEASE_REASONS.map((r) => (
                  <Pressable key={r} onPress={() => setReleaseReason(r)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: releaseReason === r ? C.red : "#DCE2EC", backgroundColor: releaseReason === r ? C.redSoft : C.card }}>
                    <Text style={{ fontSize: 12, color: releaseReason === r ? C.red : C.muted, fontWeight: "700" }}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: "row", marginTop: 10 }}>
                <Button title="Release to pool" variant="danger" onPress={onRelease} busy={busy === "release"} disabled={!!busy} />
              </View>
            </Card>
          ) : null}

          {s === "CONFIRMED" ? (
            <Card style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="hourglass-outline" size={20} color={C.amber} />
                <Text style={{ marginLeft: 8, color: C.ink, fontSize: 15, fontWeight: "900" }}>Waiting for patient payment</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
                Once the patient pays, they receive a visit OTP. Pull down to refresh.
              </Text>
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <Button title="Refresh status" variant="outline" icon="refresh" onPress={load} busy={loading} />
              </View>
            </Card>
          ) : null}

          {s === "PAID" ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ color: C.ink, fontSize: 15, fontWeight: "900" }}>Start the visit</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>At the patient's home, ask for their 6-digit visit OTP.</Text>
              <TextInput
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, ""))}
                maxLength={6}
                keyboardType="number-pad"
                placeholder="••••••"
                placeholderTextColor="#B6C0CF"
                style={{ marginTop: 13, borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 12, padding: 14, textAlign: "center", fontSize: 24, fontWeight: "900", letterSpacing: 10, color: C.ink }}
              />
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <Button title="Verify OTP & start" icon="play" onPress={onStart} busy={busy === "start"} disabled={otp.length !== 6} />
              </View>
            </Card>
          ) : null}

          {s === "IN_PROGRESS" ? (
            <Card style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.greenSoft, padding: 11, borderRadius: 11 }}>
                <Ionicons name="radio-button-on" size={18} color={C.green} />
                <Text style={{ color: C.green, fontWeight: "900", marginLeft: 7 }}>Visit in progress</Text>
              </View>
              <NoteInput value={note} onChange={setNote} placeholder="Visit summary (optional)" multiline />
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <Button title="Complete visit" variant="success" icon="checkmark-done" onPress={onComplete} busy={busy === "complete"} />
              </View>
            </Card>
          ) : null}

          {s === "COMPLETED" ? (
            <Card style={{ marginTop: 12, alignItems: "center" }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="checkmark" size={32} color={C.green} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: C.ink, marginTop: 10 }}>Visit completed</Text>
              <Text style={{ color: C.muted, marginTop: 4 }}>{rupees(booking.amount)} · {dateTime(booking.completedAt)}</Text>
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NoteInput({ value, onChange, placeholder, multiline }: { value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#98A2B3"
      multiline={multiline}
      style={{ marginTop: 12, minHeight: multiline ? 90 : undefined, borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 11, padding: 12, color: C.ink, textAlignVertical: multiline ? "top" : "center" }}
    />
  );
}
