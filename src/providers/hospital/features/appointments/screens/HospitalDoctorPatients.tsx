import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import DateNav from "../../../components/DateNav";
import { Banner, C, Card, Chip, Empty, Screen, StatusPill } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { fmtTime, istKey, todayKey } from "../../../utils/format";

const FILTERS = [["ALL", "All"], ["PENDING", "Pending"], ["COMPLETED", "Completed"], ["OTHER", "Cancelled / No-show"]] as const;

/** Booked patients for one doctor on one day, in token order. */
export default function HospitalDoctorPatients({ navigation, route }: any) {
  const { doctorId, date: initialDate } = route.params || {};
  const { rowsFor, appointments, loading, error, reload } = useHospitalData();
  const [date, setDate] = useState<string>(initialDate || todayKey());
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("ALL");

  const doctor = rowsFor(date).find((r) => r.id === doctorId);
  const day = appointments
    .filter((a) => a.doctorId === doctorId && a.dateTime && istKey(a.dateTime) === date)
    .sort((a, b) => (a.token ?? 9999) - (b.token ?? 9999) || a.dateTime.localeCompare(b.dateTime));
  const list = day.filter((a) =>
    filter === "ALL" ? true
      : filter === "PENDING" ? a.status === "CONFIRMED" || a.status === "RESCHEDULED"
      : filter === "COMPLETED" ? a.status === "COMPLETED"
      : a.status === "CANCELLED" || a.status === "NO_SHOW");

  return (
    <Screen
      title={doctor?.name || "Doctor"} subtitle={doctor ? `${doctor.specialty} · ${day.filter((a) => a.status !== "CANCELLED").length}${doctor.limit != null ? ` / ${doctor.limit}` : ""} tokens` : undefined}
      onBack={() => navigation.goBack()} onRefresh={reload} refreshing={loading}
    >
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: reload }} /> : null}
      <DateNav value={date} onChange={setDate} />
      <View style={styles.filters}>
        {FILTERS.map(([k, l]) => <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />)}
      </View>

      {list.length === 0 && !loading ? <Empty icon="people-outline" title="No patients here" hint={filter === "ALL" ? "No bookings for this day yet." : "Nothing matches this filter."} /> : null}

      {list.map((a) => (
        <Card key={a.id} onPress={() => navigation.navigate("HospitalAppointmentDetail", { appointmentId: a.id })} style={a.status === "CANCELLED" ? { opacity: 0.65 } : undefined}>
          <View style={styles.row}>
            <View style={styles.token}>
              <Text style={styles.tokenLabel}>TOKEN</Text>
              <Text style={styles.tokenNum}>{a.token ?? "–"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{a.patientName}</Text>
              <Text style={styles.sub}>
                {[a.patientAge != null ? `${a.patientAge} yrs` : "", a.patientGender ? a.patientGender[0] + a.patientGender.slice(1).toLowerCase() : "", fmtTime(a.dateTime)].filter(Boolean).join(" · ")}
              </Text>
              {a.visitType === "FOLLOW_UP" ? <Text style={styles.followTag}>Follow-up visit</Text> : null}
            </View>
            <StatusPill status={a.status} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  token: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  tokenLabel: { fontSize: 8.5, fontWeight: "800", color: C.primary, letterSpacing: 0.5 },
  tokenNum: { fontSize: 20, fontWeight: "800", color: C.primary },
  name: { fontSize: 15, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 3 },
  followTag: { fontSize: 11.5, color: C.warn, fontWeight: "700", marginTop: 4 },
});
