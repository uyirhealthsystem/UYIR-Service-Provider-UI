import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  assignDoctorToSeat, buySeats, getSeatPurchases, removeDoctorFromSeat, retrySeatPayment,
} from "../../../api/hospital";
import PaymentWebView, { type CheckoutResult } from "../../../components/PaymentWebView";
import Sheet from "../../../components/Sheet";
import { Avatar, Banner, Button, C, Card, Empty, Pill, Screen, SectionTitle, Stepper } from "../../../components/ui";
import { useHospitalData } from "../../../hooks/useHospitalData";
import { asList, fmtDateTime, upper } from "../../../utils/format";

type Purchase = { id: string; status: string; quantity: number; amount: number; createdAt: string; checkoutUrl?: string };
const normPurchase = (p: any): Purchase => ({
  id: String(p.id), status: upper(p.status), quantity: Number(p.quantity ?? p.seats ?? 0),
  amount: Number(p.amount ?? 0), createdAt: p.createdAt || p.created || "", checkoutUrl: p.checkoutUrl,
});

/** Seats: 1 is free, extra seats are bought with a payment link. One doctor per seat. */
export default function HospitalAssign({ navigation, route }: any) {
  // Opened from a "Buy a seat" shortcut → show the buy card first.
  const buyFirst = !!route?.params?.buy;
  const { rows, seats, loading, error, reload } = useHospitalData();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [busySeat, setBusySeat] = useState("");
  const [pickSeat, setPickSeat] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const knownPaid = useRef<Set<string> | null>(null);

  const loadPurchases = useCallback(async () => {
    try {
      const list = asList(await getSeatPurchases()).map(normPurchase);
      setPurchases(list);
      const paid = new Set(list.filter((p) => p.status === "PAID").map((p) => p.id));
      if (knownPaid.current) {
        const fresh = [...paid].filter((id) => !knownPaid.current!.has(id));
        if (fresh.length) { Alert.alert("Payment received", "Your new seat(s) are ready. Assign a doctor to each."); reload(); }
      }
      knownPaid.current = paid;
    } catch { /* keep previous list */ }
  }, [reload]);

  useFocusEffect(useCallback(() => { loadPurchases(); }, [loadPurchases]));

  // Returning from the payment page → check whether the payment went through.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => { if (st === "active") { loadPurchases(); reload(); } });
    return () => sub.remove();
  }, [loadPurchases, reload]);

  // While a payment is pending, poll until the seats appear.
  const hasPending = purchases.some((p) => p.status === "PENDING");
  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(loadPurchases, 5000);
    return () => clearInterval(t);
  }, [hasPending, loadPurchases]);

  // Razorpay checkout runs inside the app (PaymentWebView). It closes itself when Razorpay redirects after
  // paying; the seats themselves appear once payment-service's webhook reaches the hospital service, which
  // the polling above picks up (and shows "Payment received").
  const openCheckout = async (url?: string) => {
    if (!url) { Alert.alert("Payment link unavailable", "Please try again in a moment."); return; }
    setCheckoutUrl(url);
  };

  const onCheckoutDone = (result: CheckoutResult) => {
    setCheckoutUrl(null);
    loadPurchases(); reload();
    // "paid": the polling above shows "Payment received" once the seats are actually added.
    if (result === "failed") Alert.alert("Payment failed", "No money was taken. You can try again from Purchases.");
  };

  const startPurchase = async () => {
    setBuying(true);
    try {
      const p = normPurchase(await buySeats(qty));
      await loadPurchases();
      if (p.status === "PAID") { Alert.alert("Seats added", "Your new seat(s) are ready."); reload(); }
      else await openCheckout(p.checkoutUrl);
    } catch (e: any) {
      Alert.alert("Could not start payment", e?.status === 503 ? "Payment service is unreachable right now. Please try again shortly." : e?.message || "Please try again.");
    } finally { setBuying(false); }
  };

  const payAgain = async (id: string) => {
    try { const p = await retrySeatPayment(id); await openCheckout(p?.checkoutUrl); loadPurchases(); }
    catch (e: any) { Alert.alert("Could not create a payment link", e?.message || "Please try again."); }
  };

  const unseated = rows.filter((r) => r.active && !r.seated);
  const doctorOf = (id?: string) => rows.find((r) => r.id === id);

  const assign = async (seatId: string, doctorId: string) => {
    setPickSeat(null); setBusySeat(seatId);
    try { await assignDoctorToSeat(seatId, doctorId); await reload(); }
    catch (e: any) { Alert.alert("Could not assign", e?.status === 409 ? "The doctor currently in this seat still has upcoming appointments. Complete or cancel them first." : e?.message || "Please try again."); }
    finally { setBusySeat(""); }
  };

  const free = (seatId: string, name: string) => Alert.alert(`Remove ${name} from this seat?`, "Patients can no longer book this doctor until they are seated again.", [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: async () => {
      setBusySeat(seatId);
      try { await removeDoctorFromSeat(seatId); await reload(); }
      catch (e: any) { Alert.alert("Could not remove", e?.status === 409 ? "This doctor has upcoming appointments. Complete or cancel them first." : e?.message || "Please try again."); }
      finally { setBusySeat(""); }
    } },
  ]);

  const total = seats && seats.price ? seats.price * qty : null;

  const buyCard = (
    <>
      <SectionTitle title="Buy more seats" />
      <Card>
        <Text style={styles.buyText}>Each seat makes one doctor bookable by patients.{seats?.price ? ` ₹${seats.price} per seat.` : ""}</Text>
        <View style={styles.buyRow}>
          <Stepper value={qty} onChange={setQty} min={1} max={50} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>{total != null ? `₹${total}` : "—"}</Text>
          </View>
        </View>
        <Button title={total != null ? `Pay ₹${total}` : "Pay & buy seats"} icon="card-outline" loading={buying} onPress={startPurchase} style={{ marginTop: 14 }} />
        <Text style={styles.secure}>Secure payment by Razorpay (UPI, cards, net banking). The payment link is valid for 20 minutes. Seats are added as soon as payment succeeds.</Text>
      </Card>
    </>
  );

  return (
    <Screen title="Seats" subtitle="One doctor per seat" onBack={() => navigation.goBack()} onRefresh={() => { reload(); loadPurchases(); }} refreshing={loading}>
      {error ? <Banner tone="danger" text={error} action={{ label: "Retry", onPress: reload }} /> : null}

      <View style={styles.summary}>
        {[["Total", seats?.total], ["Used", seats?.occupied], ["Empty", seats?.empty]].map(([l, v]) => (
          <View key={String(l)} style={styles.sumBox}><Text style={styles.sumVal}>{v ?? "—"}</Text><Text style={styles.sumLabel}>{l}</Text></View>
        ))}
      </View>

      {buyFirst ? buyCard : null}

      <SectionTitle title="Your seats" />
      {seats?.seats.map((s, i) => {
        const d = doctorOf(s.doctorId);
        const name = d?.name || s.doctorName;
        return (
          <Card key={s.id}>
            <View style={styles.seatRow}>
              {s.doctorId ? <Avatar name={name || "Doctor"} /> : <View style={styles.emptyAvatar}><Text style={{ color: C.gray, fontWeight: "800" }}>{i + 1}</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={styles.seatTitle}>Seat {i + 1} <Text style={styles.seatType}>· {s.type === "FREE" ? "Included" : "Paid"}</Text></Text>
                <Text style={styles.seatDoctor} numberOfLines={1}>{s.doctorId ? name || "Doctor assigned" : "Empty"}</Text>
              </View>
              {s.doctorId ? (
                <Button small variant="dangerOutline" title="Remove" loading={busySeat === s.id} onPress={() => free(s.id, name || "this doctor")} />
              ) : (
                <Button small title="Assign" loading={busySeat === s.id} onPress={() => (unseated.length ? setPickSeat(s.id) : Alert.alert("No doctor to assign", "Add a doctor first, then place them in this seat.", [{ text: "Add doctor", onPress: () => navigation.navigate("HospitalDoctorForm") }, { text: "Close", style: "cancel" }]))} />
              )}
            </View>
          </Card>
        );
      })}
      {seats && seats.seats.length === 0 && !loading ? <Empty title="No seats yet" /> : null}

      {buyFirst ? null : buyCard}

      {purchases.length > 0 ? <SectionTitle title="Purchases" /> : null}
      {purchases.map((p) => (
        <Card key={p.id}>
          <View style={styles.seatRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.seatTitle}>{p.quantity} seat{p.quantity === 1 ? "" : "s"} · ₹{p.amount}</Text>
              <Text style={styles.seatDoctor}>{fmtDateTime(p.createdAt)}</Text>
            </View>
            <Pill text={p.status} tone={p.status === "PAID" ? "success" : p.status === "PENDING" ? "warn" : "danger"} />
          </View>
          {p.status === "PENDING" || p.status === "FAILED" ? (
            <View style={{ marginTop: 10 }}>
              <Button small variant="secondary" title={p.status === "PENDING" ? "Complete payment" : "Try payment again"} onPress={() => payAgain(p.id)} />
              {p.status === "PENDING" ? <Text style={styles.secure}>Waiting for payment… this updates automatically.</Text> : null}
            </View>
          ) : null}
        </Card>
      ))}

      <Sheet visible={!!pickSeat} title="Choose a doctor" onClose={() => setPickSeat(null)}>
        {unseated.map((d) => (
          <Pressable key={d.id} style={styles.pick} onPress={() => pickSeat && assign(pickSeat, d.id)}>
            <Avatar name={d.name} size={38} />
            <View style={{ flex: 1 }}><Text style={styles.seatTitle}>{d.name}</Text><Text style={styles.seatDoctor}>{d.specialty}</Text></View>
          </Pressable>
        ))}
      </Sheet>

      <PaymentWebView url={checkoutUrl} onDone={onCheckoutDone} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: "row", gap: 10, marginBottom: 6 },
  sumBox: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  sumVal: { fontSize: 24, fontWeight: "800", color: C.ink },
  sumLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  seatRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  emptyAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.gray, alignItems: "center", justifyContent: "center" },
  seatTitle: { fontSize: 14.5, fontWeight: "800", color: C.ink },
  seatType: { fontWeight: "600", color: C.muted },
  seatDoctor: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  buyText: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 14 },
  buyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 12, color: C.muted },
  totalVal: { fontSize: 22, fontWeight: "800", color: C.ink },
  secure: { fontSize: 11.5, color: C.muted, marginTop: 8, lineHeight: 16 },
  pick: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
});
