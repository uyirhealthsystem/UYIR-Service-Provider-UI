import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getInvoices } from "../../../api/hospital";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../../../auth/store";
import ConnectionDot from "../../../components/ConnectionDot";
import { Avatar, Banner, C, Card, Empty, Pill, ProgressBar, Screen, SectionTitle, Stat } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { useHospitalStore } from "../../provider-state/store";
import { asList, dayLabel, istKey, monthLabel, todayKey } from "../../../utils/format";

const greeting = () => {
  const istHour = new Date(Date.now() + 330 * 60000).getUTCHours();
  return istHour < 12 ? "Good morning" : istHour < 17 ? "Good afternoon" : "Good evening";
};

export default function HospitalHome({ navigation }: any) {
  const { logout } = useAuth();
  const { hospital, handlesEmergencies, setHandlesEmergencies, emergencyQueue } = useHospitalStore();
  const { rows, appointments, seats, loading, error, reload } = useHospitalData();
  const today = todayKey();

  const todays = useMemo(() => appointments.filter((a) => a.dateTime && a.status !== "CANCELLED" && istKey(a.dateTime) === today), [appointments, today]);
  const pending = todays.filter((a) => a.status === "CONFIRMED" || a.status === "RESCHEDULED").length;
  const completed = todays.filter((a) => a.status === "COMPLETED").length;
  const onDuty = rows.filter((r) => r.active && r.seated && r.onDuty).length;
  const seatedDoctors = rows.filter((r) => r.active && r.seated);

  // Overdue commission invoice blocks new bookings — surface it on the home screen.
  const [overdue, setOverdue] = useState<any>(null);
  useFocusEffect(useCallback(() => {
    getInvoices().then((d) => setOverdue(asList(d).find((i: any) => String(i.status).toUpperCase() === "OVERDUE") || null)).catch(() => {});
  }, []));

  const go = (screen: string) => navigation.navigate("HospitalTabs", { screen });
  const toggleEmergency = async (on: boolean) => {
    try { await setHandlesEmergencies(on); }
    catch (e: any) { Alert.alert("Could not update", e?.message || "Please try again."); }
  };

  return (
    <Screen
      title={hospital?.hospitalName || "Hospital"}
      subtitle={`${greeting()} · ${dayLabel(today)}`}
      onRefresh={reload} refreshing={loading}
      right={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ConnectionDot />
          <Pressable
            hitSlop={8}
            onPress={() => Alert.alert("Log out?", "You will stop receiving live updates.", [{ text: "Cancel", style: "cancel" }, { text: "Log out", style: "destructive", onPress: logout }])}
          >
            <Ionicons name="log-out-outline" size={22} color={C.muted} />
          </Pressable>
        </View>
      }
    >
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: reload }} /> : null}
      {overdue ? (
        <Banner tone="danger" text={`Invoice for ${monthLabel(overdue.period)} is overdue — new appointment bookings are paused.`}
          action={{ label: "Pay now", onPress: () => navigation.navigate("HospitalInvoiceDetail", { id: overdue.id, invoice: overdue }) }} />
      ) : null}

      {/* Emergency handling */}
      <Card style={[styles.emergency, !handlesEmergencies && { backgroundColor: C.graySoft, borderColor: C.line }]}>
        <View style={[styles.emIcon, !handlesEmergencies && { backgroundColor: C.gray }]}>
          <Ionicons name="medkit" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.emTitle}>Emergency handling</Text>
          <Text style={styles.emSub}>
            {handlesEmergencies ? "Accepting emergency requests" : "Not accepting emergency requests"}
          </Text>
        </View>
        <Switch value={handlesEmergencies} onValueChange={toggleEmergency} trackColor={{ true: C.danger, false: "#CBD5E1" }} thumbColor="#fff" />
      </Card>
      {emergencyQueue.length > 0 ? <Banner tone="danger" text={`${emergencyQueue.length} emergency request(s) waiting for your response`} /> : null}

      {/* Today at a glance */}
      <View style={styles.statRow}>
        <Stat icon="calendar" value={todays.length} label="Bookings today" />
        <Stat icon="hourglass" value={pending} label="Pending" tone="warn" />
        <Stat icon="checkmark-done" value={completed} label="Completed" tone="success" />
      </View>
      <View style={[styles.statRow, { marginTop: 10 }]}>
        <Stat icon="people" value={`${onDuty}/${seatedDoctors.length}`} label="Doctors on duty" tone="success" />
        <Stat icon="grid" value={seats ? `${seats.occupied}/${seats.total}` : "—"} label="Seats used" />
      </View>

      {/* Doctors & token fill */}
      <SectionTitle title="Doctors today" right={<Pressable onPress={() => go("HospitalAppointments")}><Text style={styles.link}>View all</Text></Pressable>} />
      {seatedDoctors.length === 0 && !loading ? (
        <Card>
          <Empty icon="person-add-outline" title="No doctors seated yet" hint="Add a doctor and place them in a seat so patients can book." />
          <Pressable style={styles.cta} onPress={() => go("HospitalDoctors")}><Text style={styles.ctaText}>Go to Doctors</Text></Pressable>
        </Card>
      ) : null}
      {seatedDoctors.map((d) => (
        <Card key={d.id} onPress={() => navigation.navigate("HospitalDoctorPatients", { doctorId: d.id, date: today })}>
          <View style={styles.docRow}>
            <Avatar name={d.name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.docName} numberOfLines={1}>{d.name}</Text>
              <Text style={styles.docSub} numberOfLines={1}>{d.specialty}</Text>
            </View>
            <Pill text={d.onDuty ? "Available" : "Off"} tone={d.onDuty ? "success" : "gray"} />
          </View>
          <View style={styles.fillRow}>
            <Text style={styles.fillText}>
              <Text style={styles.fillBold}>{d.booked}</Text>{d.limit != null ? ` / ${d.limit} tokens` : " booked"}
            </Text>
            <Text style={styles.fillMeta}>
              {d.limit == null ? "No limit set" : d.limit === 0 ? "Not taking bookings" : d.booked >= d.limit ? "Full" : `${d.limit - d.booked} left`}
            </Text>
          </View>
          <ProgressBar value={d.booked} max={d.limit} />
          <Text style={styles.fillFoot}>{d.completed} completed · {d.pending} pending</Text>
        </Card>
      ))}

      {/* Quick actions */}
      <SectionTitle title="Manage" />
      <View style={styles.grid}>
        {[
          { t: "Appointments", i: "clipboard-outline", a: () => go("HospitalAppointments") },
          { t: "Doctors & Seats", i: "people-outline", a: () => go("HospitalDoctors") },
          { t: "Token Limits", i: "options-outline", a: () => navigation.navigate("HospitalSlots") },
          { t: "Emergency Cases", i: "alert-circle-outline", a: () => go("HospitalEmergencies") },
          { t: "Reports", i: "stats-chart-outline", a: () => navigation.navigate("HospitalReports") },
          { t: "Billing", i: "receipt-outline", a: () => navigation.navigate("HospitalInvoices") },
        ].map((x) => (
          <Pressable key={x.t} style={styles.tile} onPress={x.a}>
            <View style={styles.tileIcon}><Ionicons name={x.i as any} size={22} color={C.primary} /></View>
            <Text style={styles.tileText}>{x.t}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emergency: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.dangerSoft, borderColor: "#F7C7D0" },
  emIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.danger, alignItems: "center", justifyContent: "center" },
  emTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  emSub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  statRow: { flexDirection: "row", gap: 10 },
  link: { color: C.primary, fontWeight: "700", fontSize: 13 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  docName: { fontSize: 15, fontWeight: "800", color: C.ink },
  docSub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  fillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 12, marginBottom: 7 },
  fillText: { fontSize: 13.5, color: C.muted },
  fillBold: { fontSize: 18, fontWeight: "800", color: C.ink },
  fillMeta: { fontSize: 12.5, fontWeight: "700", color: C.muted },
  fillFoot: { fontSize: 12, color: C.muted, marginTop: 7 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "48%", flexGrow: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  tileIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  tileText: { flex: 1, fontSize: 13.5, fontWeight: "700", color: C.ink },
  cta: { alignSelf: "center", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primary },
  ctaText: { color: "#fff", fontWeight: "700" },
});
