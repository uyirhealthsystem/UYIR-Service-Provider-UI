import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorDashboard } from "../../../api/hospital";
import { Avatar, Banner, Breakdown, C, Card, Chip, Empty, KV, Loading, Panel, Pill, Screen, Stat, StatusPill } from "../../../components/ui";
import { normAppt } from "../../../utils/derive";
import { addDays, fmtDateTime, money, todayKey } from "../../../utils/format";

const RANGES = [["TODAY", "Today"], ["7", "7 days"], ["30", "30 days"], ["ALL", "All time"]] as const;
type Range = (typeof RANGES)[number][0];

/** GET /doctor-appointments/doctors/{id}/dashboard — one doctor's profile, counts and appointments here. */
export default function HospitalDoctorDashboard({ navigation, route }: any) {
  const doctorId: string = route.params.doctorId;
  const [range, setRange] = useState<Range>("30");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const today = todayKey();
    const [from, to] = range === "ALL" ? [undefined, undefined]
      : range === "TODAY" ? [today, today] : [addDays(today, -(Number(range) - 1)), today];
    try { setData(await getDoctorDashboard(doctorId, from, to)); setError(""); }
    // Show the server's reason: a 403 can mean "not associated" OR "no hospital for this login".
    catch (e: any) { setError(e?.message || "Unable to load dashboard."); }
    finally { setLoading(false); }
  }, [doctorId, range]);
  useEffect(() => { load(); }, [load]);

  const d = data?.doctor || {};
  const s = data?.summary || {};
  const appts = useMemo(() => (data?.appointments || []).map((a: any) => normAppt(a))
    .sort((a: any, b: any) => b.dateTime.localeCompare(a.dateTime)), [data]);

  return (
    <Screen title={d.name || "Doctor"} subtitle="Doctor dashboard" onBack={() => navigation.goBack()} onRefresh={load} refreshing={loading && !!data}
      right={route.params.raw ? (
        <Pressable hitSlop={8} onPress={() => navigation.navigate("HospitalDoctorForm", { doctor: route.params.raw })}>
          <Ionicons name="create-outline" size={22} color={C.primary} />
        </Pressable>
      ) : undefined}
    >
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: load }} /> : null}
      {loading && !data ? <Loading /> : null}

      {data ? (
        <>
          <Card>
            <View style={styles.head}>
              <Avatar name={d.name || "D"} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{d.name}</Text>
                <Text style={styles.sub} numberOfLines={2}>{(d.specialties || []).join(", ") || d.department || "General"}</Text>
                <View style={styles.pills}>
                  <Pill text={d.checkedIn ? "ON DUTY" : "OFF DUTY"} tone={d.checkedIn ? "success" : "gray"} />
                  <Pill text={d.seated ? "SEATED" : "NO SEAT"} tone={d.seated ? "primary" : "warn"} />
                  {!d.active ? <Pill text="INACTIVE" tone="danger" /> : null}
                </View>
              </View>
            </View>
            <View style={styles.grid}>
              <KV label="Qualifications" value={(d.qualifications || []).join(", ")} />
              <KV label="Experience" value={d.yearsOfExperience != null ? `${d.yearsOfExperience} yrs` : null} />
              <KV label="Consultation fee" value={d.consultationFee != null ? money(d.consultationFee) : null} />
              <KV label="Timings" value={d.availability?.customTimings || d.availability?.type?.replace(/_/g, " ")} />
              {d.checkedIn && d.checkedInAt ? <KV label="Checked in" value={fmtDateTime(d.checkedInAt)} wide /> : null}
            </View>
            {d.contactDetails?.phone ? (
              <Pressable style={styles.call} onPress={() => Linking.openURL(`tel:${d.contactDetails.phone}`)}>
                <Ionicons name="call" size={15} color={C.primary} /><Text style={styles.callText}>{d.contactDetails.phone}</Text>
              </Pressable>
            ) : null}
          </Card>

          <View style={styles.ranges}>
            {RANGES.map(([k, l]) => <Chip key={k} label={l} active={range === k} onPress={() => setRange(k)} />)}
          </View>

          <View style={styles.statRow}>
            <Stat icon="calendar" value={s.totalAppointments ?? 0} label="Total" />
            <Stat icon="checkmark-done" value={s.completed ?? 0} label="Completed" tone="success" />
            <Stat icon="hourglass" value={s.remaining ?? 0} label="Remaining" tone="warn" />
          </View>

          <Panel title="Outcome breakdown" icon="pie-chart-outline" style={{ marginTop: 12 }}>
            <Breakdown items={[
              { label: "Completed", value: s.completed || 0, tone: "success" },
              { label: "Remaining", value: s.remaining || 0, tone: "warn" },
              { label: "No-show", value: s.noShow || 0, tone: "gray" },
              { label: "Cancelled", value: s.cancelled || 0, tone: "danger" },
            ]} />
          </Panel>

          <Text style={styles.section}>Appointments ({appts.length})</Text>
          {appts.length === 0 ? <Empty icon="calendar-outline" title="No appointments in this period" /> : null}
          {appts.map((a: any) => (
            <Card key={a.id} onPress={() => navigation.navigate("HospitalAppointmentDetail", { appointmentId: a.id })}>
              <View style={styles.apptRow}>
                <View style={styles.token}><Text style={styles.tokenText}>{a.token ?? "—"}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apptName}>{a.patientName}</Text>
                  <Text style={styles.sub}>{fmtDateTime(a.dateTime)} · {a.visitType === "FOLLOW_UP" ? "Follow-up" : "New visit"}</Text>
                </View>
                <StatusPill status={a.status} />
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 6 },
  name: { fontSize: 18, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  pills: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  call: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 8, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 9, backgroundColor: C.primarySoft },
  callText: { color: C.primary, fontWeight: "800", fontSize: 13 },
  ranges: { flexDirection: "row", gap: 8, marginVertical: 6, flexWrap: "wrap" },
  statRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  section: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 8, marginBottom: 10 },
  apptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  token: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  tokenText: { fontSize: 15, fontWeight: "800", color: C.primary },
  apptName: { fontSize: 14.5, fontWeight: "700", color: C.ink },
});
