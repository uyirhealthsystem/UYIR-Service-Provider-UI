import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getMyHospitalAnalytics, getMyHospitalMetrics } from "../../../api/hospital";
import { Banner, BarChart, Breakdown, C, Chip, Loading, Panel, Screen, Stat } from "../../../components/ui";
import { addDays, fmtDate, fmtDateKey, todayKey } from "../../../utils/format";

const RANGES = [[7, "7 days"], [30, "30 days"], [90, "90 days"], [365, "1 year"]] as const;

const APPT_TONES: Record<string, any> = { CONFIRMED: "primary", RESCHEDULED: "warn", COMPLETED: "success", NO_SHOW: "gray", CANCELLED: "danger" };
const EM_TONES: Record<string, any> = { REQUESTED: "warn", ACCEPTED: "primary", COMPLETED: "success", REJECTED: "gray", CANCELLED: "danger" };
const pretty = (k: string) => k.charAt(0) + k.slice(1).toLowerCase().replace(/_/g, " ");

/** Own-hospital performance: POST /metrics/my-hospital + POST /analytics/my-hospital (IST days, max 366). */
export default function HospitalReports({ navigation }: any) {
  const [days, setDays] = useState<number>(30);
  const [metrics, setMetrics] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const toDate = todayKey();
    const body = { fromDate: addDays(toDate, -(days - 1)), toDate };
    const [m, r] = await Promise.allSettled([getMyHospitalMetrics(body), getMyHospitalAnalytics(body)]);
    if (m.status === "fulfilled") setMetrics(m.value);
    if (r.status === "fulfilled") setReport(r.value);
    const failed = [m, r].find((x) => x.status === "rejected") as PromiseRejectedResult | undefined;
    setError(failed ? failed.reason?.message || "Unable to load reports." : "");
    setLoading(false);
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const appt = metrics?.appointments || {};
  const em = metrics?.emergencyBookings || {};
  const doc = metrics?.doctors || {};
  const row = report?.hospital || {};
  const trends: any[] = report?.trends || [];
  const completionRate = appt.total ? Math.round(((appt.byStatus?.COMPLETED || 0) / appt.total) * 100) : 0;
  const noShowRate = appt.total ? Math.round(((appt.byStatus?.NO_SHOW || 0) / appt.total) * 100) : 0;

  // Long ranges: bucket into weeks so the bars stay readable.
  const bucket = trends.length > 45 ? 7 : 1;
  const series = (key: "appointments" | "emergencyBookings") => {
    const out: { key: string; value: number; label?: string }[] = [];
    for (let i = 0; i < trends.length; i += bucket) {
      const chunk = trends.slice(i, i + bucket);
      const d = chunk[0]?.date || "";
      out.push({ key: d, value: chunk.reduce((n, p) => n + (p[key] || 0), 0), label: d ? fmtDateKey(d, false).split(" ").slice(0, 2).join(" ") : "" });
    }
    return out;
  };
  const peak = trends.reduce((best, p) => (p.appointments > (best?.appointments ?? -1) ? p : best), null as any);

  return (
    <Screen title="Reports" subtitle={metrics ? `${fmtDateKey(metrics.fromDate, false)} – ${fmtDateKey(metrics.toDate, false)}` : "Hospital performance"} onBack={() => navigation.goBack()} onRefresh={load} refreshing={loading && !!metrics}>
      <View style={styles.ranges}>
        {RANGES.map(([d, l]) => <Chip key={d} label={l} active={days === d} onPress={() => setDays(d)} />)}
      </View>
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: load }} /> : null}
      {loading && !metrics ? <Loading text="Crunching numbers…" /> : null}

      {metrics ? (
        <>
          <View style={styles.statRow}>
            <Stat icon="calendar" value={appt.total ?? 0} label="Appointments" />
            <Stat icon="checkmark-done" value={`${completionRate}%`} label="Completed" tone="success" />
            <Stat icon="person-remove-outline" value={`${noShowRate}%`} label="No-show" tone="gray" />
          </View>
          <View style={[styles.statRow, { marginTop: 10, marginBottom: 4 }]}>
            <Stat icon="pulse" value={em.total ?? 0} label="Emergencies" tone="danger" />
            <Stat icon="time-outline" value={appt.upcoming ?? 0} label="Upcoming" tone="warn" />
            <Stat icon="people" value={`${doc.checkedInNow ?? 0}/${doc.active ?? 0}`} label="On duty now" tone="success" />
          </View>

          <Panel title="Daily appointments" icon="bar-chart-outline" style={{ marginTop: 12 }} right={bucket > 1 ? <Text style={styles.hint}>per week</Text> : undefined}>
            {trends.length ? <BarChart data={series("appointments")} /> : <Text style={styles.hint}>No data for this period.</Text>}
            {peak && peak.appointments > 0 ? <Text style={styles.foot}>Busiest day: {fmtDateKey(peak.date)} · {peak.appointments} appointments</Text> : null}
          </Panel>

          <Panel title="Emergency requests" icon="pulse-outline" right={bucket > 1 ? <Text style={styles.hint}>per week</Text> : undefined}>
            {trends.length ? <BarChart data={series("emergencyBookings")} color={C.danger} height={90} /> : <Text style={styles.hint}>No data for this period.</Text>}
            <Text style={styles.foot}>{em.openNow ?? 0} open right now (requested or accepted)</Text>
          </Panel>

          <Panel title="Appointments by status" icon="pie-chart-outline">
            <Breakdown items={Object.entries(appt.byStatus || {}).map(([k, v]) => ({ label: pretty(k), value: Number(v), tone: APPT_TONES[k] }))} />
          </Panel>

          <Panel title="Emergencies by status" icon="medkit-outline">
            <Breakdown items={Object.entries(em.byStatus || {}).map(([k, v]) => ({ label: pretty(k), value: Number(v), tone: EM_TONES[k] }))} />
          </Panel>

          {report ? (
            <Panel title="Capacity" icon="bed-outline">
              <View style={styles.cap}>
                {[["General beds", row.generalBeds], ["ICU beds", row.icuBeds], ["NICU beds", row.nicuBeds], ["Doctors", row.associatedDoctors]].map(([l, v]) => (
                  <View key={String(l)} style={styles.capBox}><Text style={styles.capVal}>{v ?? 0}</Text><Text style={styles.capLabel}>{l}</Text></View>
                ))}
              </View>
            </Panel>
          ) : null}
          <Text style={styles.gen}>Generated {fmtDate(metrics.generatedAt)} · Booking counts follow the selected range; capacity and doctors are live figures.</Text>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ranges: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  statRow: { flexDirection: "row", gap: 10 },
  hint: { fontSize: 12, color: C.muted },
  foot: { fontSize: 12, color: C.muted, marginTop: 10 },
  cap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },
  capBox: { width: "48%", flexGrow: 1, backgroundColor: C.bg, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  capVal: { fontSize: 20, fontWeight: "800", color: C.ink },
  capLabel: { fontSize: 11.5, color: C.muted, marginTop: 2 },
  gen: { fontSize: 11, color: C.muted, lineHeight: 16, marginTop: 4, textAlign: "center" },
});
