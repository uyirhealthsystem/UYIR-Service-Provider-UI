import React, { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cancelAppointment, removeFollowUp, rescheduleAppointment, setFollowUp, updateAppointmentStatus } from "../../../api/hospital";
import DateTimePicker from "../../../components/DateTimePicker";
import FollowUpForm, { type FollowUpValue } from "../../../components/FollowUpForm";
import Sheet from "../../../components/Sheet";
import { Banner, Button, C, Card, Chip, ErrorText, Field, Row, Screen, SectionTitle, StatusPill } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { fmtDateKey, fmtDateTime } from "../../../utils/format";
import { isOpenStatus } from "../../../utils/derive";

const CANCEL_REASONS = ["Doctor unavailable", "Emergency at hospital", "Patient requested", "Scheduling conflict"];

export default function HospitalAppointmentDetail({ navigation, route }: any) {
  const id = route.params?.appointmentId;
  const { appointments, loading, reload } = useHospitalData();
  const a = appointments.find((x) => x.id === id);

  const [sheet, setSheet] = useState<null | "cancel" | "reschedule" | "followup">(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reason, setReason] = useState("");
  const [newIso, setNewIso] = useState("");
  const [followUp, setFollowUpValue] = useState<FollowUpValue>({});

  if (!a) {
    return (
      <Screen title="Appointment" onBack={() => navigation.goBack()} onRefresh={reload} refreshing={loading}>
        <Banner tone="gray" text={loading ? "Loading appointment…" : "This appointment is no longer available."} />
      </Screen>
    );
  }

  const open = isOpenStatus(a.status);
  const completed = a.status === "COMPLETED";
  const future = a.dateTime ? new Date(a.dateTime).getTime() > Date.now() : false;
  const fu = a.followUp;
  // Backend field is followUpBookingId (FollowUpResponse); others kept for older payloads.
  const fuBooked = !!(fu?.followUpBookingId || fu?.booked || fu?.bookedAppointmentId || fu?.followUpAppointmentId || fu?.status === "BOOKED");

  const close = () => { setSheet(null); setErr(""); setBusy(false); };
  const act = async (fn: () => Promise<any>, done?: () => void) => {
    setBusy(true); setErr("");
    try { await fn(); await reload(); done ? done() : close(); }
    catch (e: any) { setErr(e?.message || "Something went wrong. Please try again."); setBusy(false); }
  };

  const markNoShow = () => Alert.alert("Mark as no-show?", `${a.patientName} did not attend.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Mark no-show", style: "destructive", onPress: () => act(() => updateAppointmentStatus(a.id, "NO_SHOW"), () => setBusy(false)) },
  ]);

  const dropFollowUp = () => Alert.alert("Remove follow-up?", "The patient will no longer be asked to come back.", [
    { text: "Keep", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => act(() => removeFollowUp(a.id), () => setBusy(false)) },
  ]);

  return (
    <Screen title="Appointment" subtitle={`Token ${a.token ?? "–"} · ${a.doctorName}`} onBack={() => navigation.goBack()} onRefresh={reload} refreshing={loading}>
      {/* Summary */}
      <Card>
        <View style={styles.top}>
          <View style={styles.token}><Text style={styles.tokenLabel}>TOKEN</Text><Text style={styles.tokenNum}>{a.token ?? "–"}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{a.patientName}</Text>
            <Text style={styles.sub}>{[a.patientAge != null ? `${a.patientAge} yrs` : "", a.patientGender ? a.patientGender[0] + a.patientGender.slice(1).toLowerCase() : ""].filter(Boolean).join(" · ") || "—"}</Text>
          </View>
          <StatusPill status={a.status} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Row label="Doctor" value={a.doctorName} />
          <Row label="When" value={fmtDateTime(a.dateTime)} />
          <Row label="Visit" value={`${a.visitType === "FOLLOW_UP" ? "Follow-up" : "New"} · ${a.consultationType === "TELECONSULT" ? "Teleconsult" : "In person"}`} />
          <Row label="Booked for" value={a.bookedFor === "FAMILY_MEMBER" ? `Family member${a.relationship ? ` (${a.relationship})` : ""}` : "Self"} />
        </View>
        {a.patientPhone ? (
          <Pressable style={styles.call} onPress={() => Linking.openURL(`tel:${a.patientPhone}`)}>
            <Ionicons name="call" size={16} color={C.primary} />
            <Text style={styles.callText}>{a.patientPhone}</Text>
          </Pressable>
        ) : null}
      </Card>

      {a.reason || a.symptoms.length ? (
        <Card>
          {a.reason ? <><Text style={styles.label}>Reason for visit</Text><Text style={styles.body}>{a.reason}</Text></> : null}
          {a.symptoms.length ? (
            <>
              <Text style={[styles.label, a.reason ? { marginTop: 12 } : null]}>Symptoms</Text>
              <View style={styles.chips}>{a.symptoms.map((s) => <View key={s} style={styles.sym}><Text style={styles.symText}>{s}</Text></View>)}</View>
            </>
          ) : null}
        </Card>
      ) : null}

      {/* Follow-up (shown whenever one exists) */}
      {fu ? (
        <Card>
          <View style={styles.fuHead}><Ionicons name="repeat" size={18} color={C.warn} /><Text style={styles.fuTitle}>Follow-up requested</Text>{fuBooked ? <StatusPill status="CONFIRMED" /> : null}</View>
          <Row label="Due on" value={fu.dueDate ? fmtDateKey(fu.dueDate) : undefined} />
          <Row label="Bookable" value={fu.bookableFrom && fu.bookableUntil ? `${fmtDateKey(fu.bookableFrom, false)} – ${fmtDateKey(fu.bookableUntil, false)}` : undefined} />
          <Row label="Instructions" value={fu.instructions} />
          {completed && !fuBooked ? (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button style={{ flex: 1 }} small variant="secondary" title="Change" onPress={() => setSheet("followup")} />
              <Button style={{ flex: 1 }} small variant="dangerOutline" title="Remove" onPress={dropFollowUp} />
            </View>
          ) : null}
          {fuBooked ? <Text style={styles.note}>The patient has already booked this follow-up, so it can no longer be changed.</Text> : null}
        </Card>
      ) : null}

      {/* Actions */}
      {open ? (
        <>
          <SectionTitle title="Actions" />
          {future ? <Banner tone="warn" text="This visit is in the future. The server only lets you mark it complete once the appointment time has arrived." /> : null}
          <Button icon="checkmark-circle" variant="success" title="Mark complete" onPress={() => navigation.navigate("HospitalMarkComplete", { appointmentId: a.id })} />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Button style={{ flex: 1 }} variant="secondary" icon="calendar" title="Reschedule" onPress={() => setSheet("reschedule")} />
            <Button style={{ flex: 1 }} variant="dangerOutline" icon="close-circle-outline" title="Cancel" onPress={() => setSheet("cancel")} />
          </View>
          <Button style={{ marginTop: 10 }} variant="ghost" title="Mark as no-show" onPress={markNoShow} />
        </>
      ) : null}

      {completed ? (
        <>
          <SectionTitle title="Visit record" />
          <Card>
            <Row label="Status" value="Completed" />
            <Row label="Seen by" value={a.doctorName} />
            <Row label="Visit time" value={fmtDateTime(a.dateTime)} />
            <Row label="Token" value={a.token} />
            <Row label="Completed at" value={a.raw?.completedAt ? fmtDateTime(a.raw.completedAt) : undefined} />
            <Row label="Fee" value={a.raw?.consultationFee != null ? `₹${a.raw.consultationFee}` : undefined} />
            <Row label="Payment" value={a.raw?.paymentStatus} />
          </Card>
          {!fu ? <Button icon="add-circle-outline" variant="secondary" title="Add follow-up" onPress={() => setSheet("followup")} /> : null}
        </>
      ) : null}

      {!open && !completed ? <Banner tone="gray" text={a.status === "CANCELLED" ? "This appointment was cancelled." : "This appointment was marked as a no-show."} /> : null}

      {/* Cancel */}
      <Sheet visible={sheet === "cancel"} title="Cancel appointment" onClose={close}>
        <Text style={styles.sheetText}>The patient will be notified. A reason is required.</Text>
        <View style={styles.chips}>{CANCEL_REASONS.map((r) => <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />)}</View>
        <View style={{ height: 12 }} />
        <Field label="Reason" value={reason} onChangeText={setReason} multiline maxLength={500} placeholder="Why is it being cancelled?" />
        <ErrorText text={err} />
        <Button variant="danger" title="Cancel appointment" loading={busy} disabled={!reason.trim()} onPress={() => act(() => cancelAppointment(a.id, reason.trim()), () => { setReason(""); close(); })} />
      </Sheet>

      {/* Reschedule */}
      <Sheet visible={sheet === "reschedule"} title="Reschedule" onClose={close}>
        <DateTimePicker initialIso={a.dateTime} onChange={setNewIso} />
        <ErrorText text={err} />
        <Button style={{ marginTop: 14 }} title="Confirm new time" loading={busy} disabled={!newIso} onPress={() => act(() => rescheduleAppointment(a.id, { appointmentDateTime: newIso }))} />
      </Sheet>

      {/* Follow-up */}
      <Sheet visible={sheet === "followup"} title={fu ? "Change follow-up" : "Add follow-up"} onClose={close}>
        <FollowUpForm onChange={setFollowUpValue} />
        <ErrorText text={err} />
        <Button title="Save follow-up" loading={busy} onPress={() => act(() => setFollowUp(a.id, followUp))} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  token: { width: 54, height: 54, borderRadius: 13, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  tokenLabel: { fontSize: 8.5, fontWeight: "800", color: C.primary, letterSpacing: 0.5 },
  tokenNum: { fontSize: 22, fontWeight: "800", color: C.primary },
  name: { fontSize: 17, fontWeight: "800", color: C.ink },
  sub: { fontSize: 13, color: C.muted, marginTop: 3 },
  call: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.primarySoft },
  callText: { color: C.primary, fontWeight: "800", fontSize: 14 },
  label: { fontSize: 12, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  body: { fontSize: 14.5, color: C.ink, marginTop: 5, lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  sym: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, backgroundColor: C.warnSoft },
  symText: { fontSize: 12.5, fontWeight: "700", color: C.warn },
  fuHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  fuTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: C.ink },
  note: { fontSize: 12.5, color: C.muted, marginTop: 10, lineHeight: 17 },
  sheetText: { fontSize: 13, color: C.muted, marginBottom: 4, lineHeight: 18 },
});
