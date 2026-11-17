import React, { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Linking, StyleSheet, Text, View } from "react-native";
import { getInvoice, getInvoiceAppointments, payInvoice } from "../../../api/hospital";
import { Banner, Button, C, KV, Loading, Panel, Screen, StatusPill } from "../../../components/ui";
import { normAppt } from "../../../utils/derive";
import { asList, fmtDate, fmtDateTime, money, monthLabel, upper } from "../../../utils/format";

/** One invoice: totals, the appointments billed on it, and online payment. */
export default function HospitalInvoiceDetail({ navigation, route }: any) {
  const id: string = route.params.id;
  const [inv, setInv] = useState<any>(route.params.invoice || null);
  const [appts, setAppts] = useState<any[] | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [i, a] = await Promise.all([getInvoice(id), getInvoiceAppointments(id)]);
      setInv(i); setAppts(asList(a)); setError("");
    } catch (e: any) { setError(e?.message || "Unable to load invoice."); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  // Back from the payment page → the webhook may have marked it PAID.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") load(); });
    return () => sub.remove();
  }, [load]);

  const pay = async () => {
    setPaying(true);
    try {
      const r = await payInvoice(id);
      setInv(r);
      if (upper(r?.status) === "PAID") { Alert.alert("Already paid", "This invoice is settled."); return; }
      if (!r?.checkoutUrl) { Alert.alert("Payment link unavailable", r?.failureReason || "Please try again shortly."); return; }
      await Linking.openURL(r.checkoutUrl);
    } catch (e: any) {
      Alert.alert("Could not start payment", e?.status === 503 ? "Payment service is unavailable right now. Please retry shortly." : e?.message || "Please try again.");
    } finally { setPaying(false); }
  };

  if (!inv) return <Screen title="Invoice" onBack={() => navigation.goBack()}>{error ? <Banner tone="danger" text={error} /> : <Loading />}</Screen>;

  const st = upper(inv.status);
  const rate = inv.appointmentCount ? Number(inv.amount) / inv.appointmentCount : null;

  return (
    <Screen
      title={monthLabel(inv.period)} subtitle={`Invoice ${inv.id}`} onBack={() => navigation.goBack()} onRefresh={load}
      footer={st !== "PAID" ? <Button title={`Pay ${money(inv.amount, inv.currency)}`} icon="card-outline" variant={st === "OVERDUE" ? "danger" : "primary"} loading={paying} onPress={pay} /> : undefined}
    >
      {error ? <Banner tone="danger" text={error} /> : null}
      {st === "OVERDUE" ? <Banner tone="danger" text="Overdue — new appointment bookings are paused until this is paid. Existing appointments and emergencies are unaffected." /> : null}
      {inv.failureReason && st !== "PAID" ? <Banner tone="warn" text={`Last payment attempt failed: ${inv.failureReason}`} /> : null}

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Amount {st === "PAID" ? "paid" : "due"}</Text>
        <Text style={styles.amount}>{money(inv.amount, inv.currency)}</Text>
        <View style={{ marginTop: 10 }}><StatusPill status={st} /></View>
      </View>

      <Panel title="Summary" icon="document-text-outline">
        <View style={styles.grid}>
          <KV label="Billing period" value={`${fmtDate(inv.periodStart)} – ${fmtDate(inv.periodEnd)}`} wide />
          <KV label="Appointments" value={inv.appointmentCount} />
          <KV label="Rate" value={rate != null ? `${money(rate)} / appt` : null} />
          <KV label="Issued" value={fmtDate(inv.issuedAt)} />
          <KV label="Due" value={fmtDate(inv.dueDate)} />
          {st === "PAID" ? <KV label="Paid on" value={fmtDate(inv.paidAt)} /> : null}
          {inv.offlinePaymentReference ? <KV label="Reference" value={inv.offlinePaymentReference} /> : null}
          {inv.paymentId ? <KV label="Payment ID" value={inv.paymentId} wide /> : null}
        </View>
      </Panel>

      <Panel title="Billed appointments" icon="list-outline" right={<Text style={styles.count}>{appts?.length ?? "…"}</Text>}>
        {appts === null ? <Loading text="Loading appointments…" /> : null}
        {appts && appts.length === 0 ? <Text style={styles.muted}>No appointments on this invoice.</Text> : null}
        {appts?.map((raw, i) => {
          const a = normAppt(raw);
          return (
            <View key={a.id} style={[styles.appt, i === appts.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.apptName}>{a.patientName}{a.token ? `  ·  #${a.token}` : ""}</Text>
                <Text style={styles.muted}>{fmtDateTime(a.dateTime)}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={styles.fee}>{money(raw.commissionFee ?? rate ?? 0)}</Text>
                <StatusPill status={a.status} />
              </View>
            </View>
          );
        })}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountCard: { alignItems: "center", backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, paddingVertical: 22, marginBottom: 12 },
  amountLabel: { fontSize: 12.5, color: C.muted, fontWeight: "600" },
  amount: { fontSize: 32, fontWeight: "800", color: C.ink, marginTop: 4, letterSpacing: -0.5 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  count: { fontSize: 12, fontWeight: "800", color: C.primary },
  muted: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  appt: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  apptName: { fontSize: 14, fontWeight: "700", color: C.ink },
  fee: { fontSize: 13.5, fontWeight: "800", color: C.ink },
});
