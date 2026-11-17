import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { removeDateTokenLimit, setDailyTokenLimit, setDateTokenLimit } from "../../../api/hospital";
import { Avatar, Banner, Button, C, Card, Chip, Empty, Screen, SectionTitle, Stepper } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { addDays, dayLabel, fmtDateKey, todayKey } from "../../../utils/format";

/** Token limits: daily default per doctor + per-date overrides (0 = no appointments that day). */
export default function HospitalSlots({ navigation, route }: any) {
  const { rows, limits, loading, error, reload } = useHospitalData();
  const doctors = rows.filter((r) => r.active && r.seated);
  const [doctorId, setDoctorId] = useState<string>(route?.params?.doctorId || "");
  const [daily, setDaily] = useState(30);
  const [dateKey, setDateKey] = useState(addDays(todayKey(), 1));
  const [dateLimit, setDateLimit] = useState(30);
  const [busy, setBusy] = useState("");

  useEffect(() => { if (!doctorId && doctors[0]) setDoctorId(doctors[0].id); }, [doctors.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = doctors.find((d) => d.id === doctorId);
  const lim = limits[doctorId];
  useEffect(() => { if (lim?.dailyLimit != null) setDaily(lim.dailyLimit); }, [doctorId, lim?.dailyLimit]);

  const run = async (key: string, fn: () => Promise<any>, ok?: string) => {
    setBusy(key);
    try { await fn(); await reload(); if (ok) Alert.alert("Saved", ok); }
    catch (e: any) { Alert.alert("Could not save", e?.message || "Please try again."); }
    finally { setBusy(""); }
  };

  const overrides = Object.entries(lim?.dateLimits || {}).sort(([a], [b]) => a.localeCompare(b));
  const days = Array.from({ length: 21 }, (_, i) => addDays(todayKey(), i));

  return (
    <Screen title="Token Limits" subtitle="How many patients a doctor sees per day" onBack={() => navigation.goBack()} onRefresh={reload} refreshing={loading}>
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: reload }} /> : null}
      {doctors.length === 0 && !loading ? <Empty icon="people-outline" title="No seated doctors" hint="Seat a doctor first, then set their token limit." /> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
        {doctors.map((d) => <Chip key={d.id} label={d.name} active={d.id === doctorId} onPress={() => setDoctorId(d.id)} />)}
      </ScrollView>

      {current ? (
        <>
          <Card>
            <View style={styles.head}>
              <Avatar name={current.name} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{current.name}</Text>
                <Text style={styles.sub}>{current.specialty}</Text>
              </View>
            </View>
            <Text style={styles.today}>
              Today: <Text style={styles.bold}>{current.booked}</Text> booked · limit <Text style={styles.bold}>{current.limit ?? "none"}</Text>
            </Text>
          </Card>

          <SectionTitle title="Daily limit" />
          <Card>
            <Text style={styles.hint}>Tokens issued every day. Applies unless a date below overrides it.</Text>
            <View style={styles.stepRow}>
              <Stepper value={daily} onChange={setDaily} min={1} max={1000} step={5} />
              <Text style={styles.cur}>{lim?.dailyLimit != null ? `Current: ${lim.dailyLimit}` : "No limit set"}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Button style={{ flex: 1 }} title="Save daily limit" loading={busy === "daily"} onPress={() => run("daily", () => setDailyTokenLimit(doctorId, daily), "Daily token limit updated.")} />
              {lim?.dailyLimit != null ? (
                <Button variant="ghost" title="Remove" loading={busy === "rm"} onPress={() => run("rm", () => setDailyTokenLimit(doctorId, null), "Daily limit removed.")} />
              ) : null}
            </View>
          </Card>

          <SectionTitle title="Date-wise limit" />
          <Card>
            <Text style={styles.hint}>Override one date — e.g. a half day, or 0 for leave (no appointments).</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
              {days.map((k) => <Chip key={k} label={k === todayKey() ? "Today" : fmtDateKey(k, true).split(",")[0] + " " + k.slice(8) + "/" + k.slice(5, 7)} active={k === dateKey} onPress={() => setDateKey(k)} />)}
            </ScrollView>
            <View style={styles.stepRow}>
              <Stepper value={dateLimit} onChange={setDateLimit} min={0} max={1000} step={5} />
              <Text style={styles.cur}>{dateLimit === 0 ? "No appointments" : `${dateLimit} tokens`}</Text>
            </View>
            <Button style={{ marginTop: 14 }} variant="secondary" title={`Set for ${dayLabel(dateKey)}`} loading={busy === "date"} onPress={() => run("date", () => setDateTokenLimit(doctorId, dateKey, dateLimit), "Date limit saved.")} />
          </Card>

          {overrides.length > 0 ? <SectionTitle title="Upcoming overrides" /> : null}
          {overrides.map(([k, v]) => (
            <Card key={k} style={styles.ovr}>
              <Ionicons name="calendar-outline" size={20} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{dayLabel(k)}</Text>
                <Text style={styles.sub}>{Number(v) === 0 ? "No appointments (leave)" : `${v} tokens`}</Text>
              </View>
              <Pressable hitSlop={8} onPress={() => run(`d${k}`, () => removeDateTokenLimit(doctorId, k))}>
                <Ionicons name="trash-outline" size={20} color={C.danger} />
              </Pressable>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 15, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  today: { marginTop: 12, fontSize: 13, color: C.muted },
  bold: { fontWeight: "800", color: C.ink },
  hint: { fontSize: 12.5, color: C.muted, lineHeight: 18 },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  cur: { fontSize: 13, color: C.muted, fontWeight: "600" },
  ovr: { flexDirection: "row", alignItems: "center", gap: 12 },
});
