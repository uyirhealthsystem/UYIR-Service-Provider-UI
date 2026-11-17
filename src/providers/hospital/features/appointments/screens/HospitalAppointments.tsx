import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateNav from "../../../components/DateNav";
import { Avatar, Banner, C, Card, Empty, Screen } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { todayKey } from "../../../utils/format";

/** Appointments by doctor: name + how many bookings for the chosen day. Tap a doctor to see patients. */
export default function HospitalAppointments({ navigation }: any) {
  const { rowsFor, loading, error, reload } = useHospitalData();
  const [date, setDate] = useState(todayKey());

  const rows = rowsFor(date).filter((r) => r.booked > 0 || (r.active && r.seated)).sort((a, b) => b.booked - a.booked || a.name.localeCompare(b.name));
  const total = rows.reduce((n, r) => n + r.booked, 0);

  return (
    <Screen title="Appointments" subtitle={`${total} booking${total === 1 ? "" : "s"} · ${rows.length} doctor${rows.length === 1 ? "" : "s"}`} onRefresh={reload} refreshing={loading}>
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: reload }} /> : null}
      <DateNav value={date} onChange={setDate} />

      {rows.length === 0 && !loading ? <Empty icon="calendar-outline" title="No doctors to show" hint="Seat a doctor to start receiving appointments." /> : null}

      {rows.map((r) => (
        <Card key={r.id} onPress={() => navigation.navigate("HospitalDoctorPatients", { doctorId: r.id, date })}>
          <View style={styles.row}>
            <Avatar name={r.name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.sub} numberOfLines={1}>{r.specialty}</Text>
              <Text style={styles.meta}>{r.pending} pending · {r.completed} completed</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.count}>{r.booked}</Text>
              <Text style={styles.countLabel}>{r.limit != null ? `of ${r.limit}` : "booked"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.gray} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  meta: { fontSize: 12, color: C.muted, marginTop: 5 },
  countBox: { minWidth: 56, alignItems: "center", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, backgroundColor: C.primarySoft },
  count: { fontSize: 22, fontWeight: "800", color: C.primary },
  countLabel: { fontSize: 10.5, fontWeight: "700", color: C.primary },
});
