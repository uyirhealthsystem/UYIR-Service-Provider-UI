import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getInvoices } from "../../../api/hospital";
import { Banner, C, Card, Empty, Loading, Screen, StatusPill } from "../../../components/ui";
import { asList, fmtDate, money, monthLabel, upper } from "../../../utils/format";

/** Monthly commission invoices (₹ per doctor appointment). An OVERDUE invoice blocks new bookings. */
export default function HospitalInvoices({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(asList(await getInvoices())); setError(""); }
    catch (e: any) { setError(e?.message || "Unable to load invoices."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const unpaid = items.filter((i) => upper(i.status) !== "PAID");
  const outstanding = unpaid.reduce((n, i) => n + Number(i.amount || 0), 0);
  const overdue = items.some((i) => upper(i.status) === "OVERDUE");
  const paidTotal = items.filter((i) => upper(i.status) === "PAID").reduce((n, i) => n + Number(i.amount || 0), 0);

  return (
    <Screen title="Billing & invoices" subtitle="Platform commission per appointment" onBack={() => navigation.goBack()} onRefresh={load} refreshing={loading && items.length > 0}>
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: load }} /> : null}
      {overdue ? <Banner tone="danger" text="You have an overdue invoice. New appointment bookings are paused until it is paid." /> : null}

      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sumLabel}>Outstanding</Text>
          <Text style={styles.sumValue}>{money(outstanding)}</Text>
          <Text style={styles.sumFoot}>{unpaid.length} unpaid invoice{unpaid.length === 1 ? "" : "s"}</Text>
        </View>
        <View style={styles.sumDivider} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sumLabel}>Paid to date</Text>
          <Text style={[styles.sumValue, { fontSize: 20 }]}>{money(paidTotal)}</Text>
          <Text style={styles.sumFoot}>Emergency bookings are never charged</Text>
        </View>
      </View>

      {loading && items.length === 0 ? <Loading /> : null}
      {!loading && items.length === 0 && !error ? (
        <Empty icon="receipt-outline" title="No invoices yet" hint="Invoices are issued on the 1st of each month for the previous month's appointments." />
      ) : null}

      {items.map((inv) => {
        const st = upper(inv.status);
        return (
          <Card key={inv.id} onPress={() => navigation.navigate("HospitalInvoiceDetail", { id: inv.id, invoice: inv })}>
            <View style={styles.row}>
              <View style={[styles.icon, st === "OVERDUE" && { backgroundColor: C.dangerSoft }, st === "PAID" && { backgroundColor: C.successSoft }]}>
                <Ionicons name="receipt-outline" size={20} color={st === "OVERDUE" ? C.danger : st === "PAID" ? C.success : C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{monthLabel(inv.period)}</Text>
                <Text style={styles.sub}>{inv.appointmentCount} appointments · {st === "PAID" ? `Paid ${fmtDate(inv.paidAt)}` : `Due ${fmtDate(inv.dueDate)}`}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Text style={styles.amount}>{money(inv.amount, inv.currency)}</Text>
                <StatusPill status={st} />
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: "row", backgroundColor: C.ink, borderRadius: 18, padding: 18, marginBottom: 14 },
  sumDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: 14 },
  sumLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  sumValue: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 4 },
  sumFoot: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4, lineHeight: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  amount: { fontSize: 15.5, fontWeight: "800", color: C.ink },
});
