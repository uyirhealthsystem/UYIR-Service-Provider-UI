import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Avatar, Banner, C, Card, Empty, Pill, ProgressBar, Screen } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { todayKey } from "../../../utils/format";

/** Doctor schedule: timings, on-duty status and today's token fill for every seated doctor. */
export default function HospitalSchedule({ navigation }: any) {
  const { rows, loading, error, reload } = useHospitalData();
  const list = rows.filter((r) => r.active && r.seated);
  return (
    <Screen title="Doctor Schedule" onBack={() => navigation.goBack()} onRefresh={reload} refreshing={loading}>
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: reload }} /> : null}
      {list.length === 0 && !loading ? <Empty icon="time-outline" title="No seated doctors" /> : null}
      {list.map((d) => (
        <Card key={d.id} onPress={() => navigation.navigate("HospitalDoctorPatients", { doctorId: d.id, date: todayKey() })}>
          <View style={styles.row}>
            <Avatar name={d.name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{d.name}</Text>
              <Text style={styles.sub}>{d.timings || "Timings not set"}</Text>
            </View>
            <Pill text={d.onDuty ? "Available" : "Off"} tone={d.onDuty ? "success" : "gray"} />
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.fill}>{d.booked}{d.limit != null ? ` / ${d.limit}` : ""} tokens today</Text>
            <ProgressBar value={d.booked} max={d.limit} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 15, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  fill: { fontSize: 12.5, color: C.muted, marginBottom: 6, fontWeight: "600" },
});
