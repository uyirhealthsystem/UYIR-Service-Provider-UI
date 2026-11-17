import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { completeEmergencyBooking, getEmergencyBookings } from "../../../api/hospital";
import { Banner, Button, C, Card, Chip, Empty, Screen, StatusPill } from "../../../components/ui";
import { asList, fmtDateTime, upper } from "../../../utils/format";
import { useHospitalStore } from "../../provider-state/store";

const TABS = [["ACTIVE", "Active"], ["HISTORY", "History"]] as const;

/**
 * Emergency cases. New requests are answered in the full-screen alert (accept / decline);
 * this screen is where accepted cases are tracked and closed, and where history lives.
 */
export default function HospitalEmergencies() {
  const { handlesEmergencies, setHandlesEmergencies, revision, emergencyQueue } = useHospitalStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("ACTIVE");
  const [busy, setBusy] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { setItems(asList(await getEmergencyBookings())); setError(""); }
    catch (e: any) { setError(e?.message || "Unable to load emergency cases."); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(false); }, [load]));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => load(true), 400);
    return () => clearTimeout(t);
  }, [revision, emergencyQueue.length, load]);

  const complete = (id: string) => Alert.alert("Close this case?", "Mark the emergency as completed.", [
    { text: "Cancel", style: "cancel" },
    { text: "Complete", onPress: async () => {
      setBusy(id);
      try { await completeEmergencyBooking(id); await load(true); }
      catch (e: any) { Alert.alert("Could not complete", e?.message || "Please try again."); }
      finally { setBusy(""); }
    } },
  ]);

  const sorted = [...items].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const active = sorted.filter((e) => ["REQUESTED", "ACCEPTED"].includes(upper(e.status)));
  const history = sorted.filter((e) => !["REQUESTED", "ACCEPTED"].includes(upper(e.status)));
  const list = tab === "ACTIVE" ? active : history;

  const toggle = async (on: boolean) => {
    try { await setHandlesEmergencies(on); } catch (e: any) { Alert.alert("Could not update", e?.message || "Please try again."); }
  };

  return (
    <Screen title="Emergency Cases" subtitle={`${active.length} active`} onRefresh={() => load(false)} refreshing={loading}>
      <Card style={styles.toggle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tTitle}>Accepting emergencies</Text>
          <Text style={styles.tSub}>{handlesEmergencies ? "Patients can send emergency requests to you." : "You are hidden from emergency search."}</Text>
        </View>
        <Switch value={handlesEmergencies} onValueChange={toggle} trackColor={{ true: C.danger, false: "#CBD5E1" }} thumbColor="#fff" />
      </Card>
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: () => load(false) }} /> : null}

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {TABS.map(([k, l]) => <Chip key={k} label={l} active={tab === k} onPress={() => setTab(k)} />)}
      </View>

      {list.length === 0 && !loading ? <Empty icon="medkit-outline" title={tab === "ACTIVE" ? "No active emergencies" : "No past cases"} hint={tab === "ACTIVE" ? "New requests will appear with an alarm." : undefined} /> : null}

      {list.map((e) => {
        const st = upper(e.status);
        return (
          <Card key={e.id}>
            <View style={styles.row}>
              <View style={[styles.icon, st === "REQUESTED" && { backgroundColor: C.dangerSoft }]}>
                <Ionicons name="heart" size={20} color={st === "REQUESTED" ? C.danger : C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{e.patientName || "Patient"}</Text>
                <Text style={styles.sub}>{e.emergencyType || "Emergency"}</Text>
                {e.createdAt ? <Text style={styles.time}>{fmtDateTime(e.createdAt)}</Text> : null}
              </View>
              <StatusPill status={st} />
            </View>
            {e.rejectionReason || e.cancellationReason ? <Text style={styles.reason}>Reason: {e.rejectionReason || e.cancellationReason}</Text> : null}
            {e.patientPhone && (st === "ACCEPTED" || st === "REQUESTED") ? (
              <Pressable style={styles.call} onPress={() => Linking.openURL(`tel:${e.patientPhone}`)}>
                <Ionicons name="call" size={15} color={C.primary} /><Text style={styles.callText}>{e.patientPhone}</Text>
              </Pressable>
            ) : null}
            {st === "ACCEPTED" ? <Button style={{ marginTop: 12 }} variant="success" icon="checkmark-done" title="Mark completed" loading={busy === String(e.id)} onPress={() => complete(String(e.id))} /> : null}
            {st === "REQUESTED" ? <Text style={styles.waiting}>Waiting for your response in the alert.</Text> : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: "row", alignItems: "center", gap: 12 },
  tTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  tSub: { fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  time: { fontSize: 11.5, color: C.muted, marginTop: 3 },
  reason: { fontSize: 12.5, color: C.muted, marginTop: 10 },
  call: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 10, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 9, backgroundColor: C.primarySoft },
  callText: { color: C.primary, fontWeight: "800", fontSize: 13 },
  waiting: { fontSize: 12.5, color: C.danger, fontWeight: "700", marginTop: 10 },
});
