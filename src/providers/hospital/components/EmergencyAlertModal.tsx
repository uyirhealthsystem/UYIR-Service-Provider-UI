import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { acceptEmergencyBooking, rejectEmergencyBooking } from "../api/hospital";
import { useHospitalStore } from "../features/provider-state/store";
import { startAlarm, stopAlarm } from "../realtime/alarm";
import { minutesAgo } from "../utils/format";
import { C } from "./ui";

const QUICK_REASONS = ["No ICU bed available", "Specialist not available", "Hospital at full capacity", "Cannot handle this condition"];

/**
 * Full-screen, non-dismissible emergency alert.
 *  - Sounds a looping alarm until every request is answered.
 *  - Android back button / swipe-down are disabled: the only exits are Accept or Decline.
 *  - Declining requires a reason (the API requires one).
 */
export default function EmergencyAlertModal() {
  const { emergencyQueue, removeEmergency, refreshEmergencies } = useHospitalStore();
  const current = emergencyQueue[0];
  const live = !!current && !current.cancelled;

  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const pulse = useRef(new Animated.Value(0)).current;

  // Alarm runs while there is at least one live (not cancelled) request.
  useEffect(() => {
    if (live) startAlarm(); else stopAlarm();
    return () => { stopAlarm(); };
  }, [live]);

  // Reset the form whenever a different request becomes current.
  useEffect(() => {
    setDeclining(false); setReason(""); setError(""); setBusy(null);
  }, [current?.id]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (!current) return null;

  // 409 = someone already handled it / patient cancelled → just sync and move on.
  const handleFailure = (e: any) => {
    if (e?.status === 409) { removeEmergency(current.id); refreshEmergencies(); return; }
    setError(e?.message || "Could not update the request. Check your connection and try again.");
  };

  const accept = async () => {
    setBusy("accept"); setError("");
    try { await acceptEmergencyBooking(current.id); removeEmergency(current.id); }
    catch (e) { handleFailure(e); }
    finally { setBusy(null); }
  };

  const decline = async () => {
    if (!reason.trim()) { setError("Please give a reason for declining."); return; }
    setBusy("reject"); setError("");
    try { await rejectEmergencyBooking(current.id, reason.trim().slice(0, 500)); removeEmergency(current.id); }
    catch (e) { handleFailure(e); }
    finally { setBusy(null); }
  };

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const more = emergencyQueue.length - 1;

  return (
    <Modal
      visible transparent animationType="fade" statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => { /* intentionally blocked: must accept or decline */ }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={styles.sheet}>
            <View style={[styles.top, current.cancelled && { backgroundColor: C.gray }]}>
              <Animated.View style={{ transform: [{ scale: current.cancelled ? 1 : scale }] }}>
                <View style={styles.iconRing}>
                  <Ionicons name={current.cancelled ? "close-circle" : "alert"} size={34} color="#fff" />
                </View>
              </Animated.View>
              <Text style={styles.topTitle}>{current.cancelled ? "Request Cancelled" : "Emergency Request"}</Text>
              <Text style={styles.topSub}>
                {current.cancelled ? "The patient cancelled this request" : "A patient needs immediate care"}
                {more > 0 ? `  ·  ${more} more waiting` : ""}
              </Text>
            </View>

            <View style={styles.body}>
              <View style={styles.infoRow}>
                <Ionicons name="person-circle-outline" size={22} color={C.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Patient</Text>
                  <Text style={styles.value}>{current.patientName}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="pulse-outline" size={22} color={C.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Condition</Text>
                  <Text style={[styles.value, { color: C.danger }]}>{current.emergencyType}</Text>
                </View>
              </View>
              {current.patientPhone ? (
                <Pressable style={styles.infoRow} onPress={() => Linking.openURL(`tel:${current.patientPhone}`)}>
                  <Ionicons name="call-outline" size={22} color={C.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Phone (tap to call)</Text>
                    <Text style={[styles.value, { color: C.primary }]}>{current.patientPhone}</Text>
                  </View>
                </Pressable>
              ) : null}
              {current.createdAt ? <Text style={styles.ago}>Requested {minutesAgo(current.createdAt)}</Text> : null}

              {current.cancelled ? (
                <Pressable style={[styles.btn, { backgroundColor: C.primary }]} onPress={() => removeEmergency(current.id)}>
                  <Text style={styles.btnText}>OK, dismiss</Text>
                </Pressable>
              ) : declining ? (
                <View>
                  <Text style={styles.label}>Reason for declining</Text>
                  <View style={styles.quickWrap}>
                    {QUICK_REASONS.map((r) => (
                      <Pressable key={r} onPress={() => setReason(r)} style={[styles.quick, reason === r && styles.quickOn]}>
                        <Text style={[styles.quickText, reason === r && { color: "#fff" }]}>{r}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    value={reason} onChangeText={setReason} placeholder="Type a reason…" placeholderTextColor="#9AA6B7"
                    multiline maxLength={500} style={styles.input}
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <Pressable style={[styles.btn, { backgroundColor: C.danger, opacity: busy ? 0.6 : 1 }]} disabled={!!busy} onPress={decline}>
                    <Text style={styles.btnText}>{busy === "reject" ? "Declining…" : "Confirm Decline"}</Text>
                  </Pressable>
                  <Pressable style={styles.link} disabled={!!busy} onPress={() => { setDeclining(false); setError(""); }}>
                    <Text style={styles.linkText}>Back</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <Pressable style={[styles.btn, { backgroundColor: C.success, opacity: busy ? 0.6 : 1 }]} disabled={!!busy} onPress={accept}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.btnText}>{busy === "accept" ? "Accepting…" : "Accept Emergency"}</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.btnOutline]} disabled={!!busy} onPress={() => { setDeclining(true); setError(""); }}>
                    <Ionicons name="close-circle-outline" size={20} color={C.danger} />
                    <Text style={[styles.btnText, { color: C.danger }]}>Decline</Text>
                  </Pressable>
                  <Text style={styles.hint}>You must accept or decline to continue.</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,18,32,0.82)" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  sheet: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" },
  top: { backgroundColor: C.danger, alignItems: "center", paddingVertical: 22, paddingHorizontal: 16 },
  iconRing: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  topTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 12 },
  topSub: { color: "rgba(255,255,255,0.92)", fontSize: 13, marginTop: 4, textAlign: "center" },
  body: { padding: 18 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9 },
  label: { color: C.muted, fontSize: 12, fontWeight: "600" },
  value: { color: C.ink, fontSize: 17, fontWeight: "800", marginTop: 1 },
  ago: { color: C.muted, fontSize: 12.5, marginTop: 2, marginBottom: 14 },
  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 15, borderRadius: 13, marginTop: 10 },
  btnOutline: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.danger },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  hint: { textAlign: "center", color: C.muted, fontSize: 12, marginTop: 12 },
  error: { color: C.danger, fontSize: 13, marginTop: 6, lineHeight: 18 },
  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 10 },
  quick: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: "#F8FAFD" },
  quickOn: { backgroundColor: C.danger, borderColor: C.danger },
  quickText: { fontSize: 12.5, fontWeight: "700", color: C.muted },
  input: { backgroundColor: "#F8FAFD", borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 12, minHeight: 70, textAlignVertical: "top", color: C.ink, fontSize: 15 },
  link: { alignItems: "center", paddingVertical: 12 },
  linkText: { color: C.primary, fontWeight: "700", fontSize: 14 },
});
