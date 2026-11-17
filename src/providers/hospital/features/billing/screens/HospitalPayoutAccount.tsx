import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPayoutAccount, savePayoutAccount } from "../../../api/hospital";
import { Banner, Button, C, ChipSelect, ErrorText, Field, KV, Loading, Panel, Screen, StatusPill } from "../../../components/ui";
import { fmtDate, upper } from "../../../utils/format";
import { useHospitalStore } from "../../provider-state/store";
import { BUSINESS_TYPES } from "../../profile/constants";

const STATUS_COPY: Record<string, { title: string; text: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  PENDING_DETAILS: { title: "Details pending", text: "Razorpay still needs some details. Review and submit again.", icon: "time-outline", color: C.warn },
  UNDER_REVIEW: { title: "Under review", text: "Razorpay is verifying your KYC and bank account. This usually takes 1–2 working days.", icon: "hourglass-outline", color: C.primary },
  NEEDS_CLARIFICATION: { title: "Action needed", text: "Fix the items below and submit again.", icon: "alert-circle-outline", color: C.warn },
  ACTIVATED: { title: "Payouts active", text: "Your share of patient payments is settled to this account.", icon: "checkmark-circle", color: C.success },
  SUSPENDED: { title: "Suspended", text: "Razorpay suspended this account. Please contact Razorpay support.", icon: "close-circle", color: C.danger },
};

const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits10 = (v: string) => v.replace(/\D/g, "").slice(-10);

/** Bank account for the hospital's share of patient payments (Razorpay Route linked account). */
export default function HospitalPayoutAccount({ navigation }: any) {
  const { hospital } = useHospitalStore();
  const [account, setAccount] = useState<any | null>(null);
  const [status, setStatus] = useState<"loading" | "none" | "ready" | "error">("loading");
  const [editing, setEditing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const a = hospital?.address || {}, c = hospital?.contactDetails || {};
  const [f, setF] = useState({
    legalBusinessName: hospital?.hospitalName || "", businessType: hospital?.ownershipType === "TRUST" ? "trust" : "private_limited",
    contactName: "", email: c.email || "", phone: digits10(c.phone || ""),
    street1: a.addressLine || "", street2: "", city: a.city || "", state: a.state || "", postalCode: a.pincode || "",
    pan: "", gst: "", sName: "", sEmail: "", sPhone: "", sPan: "",
    accountNumber: "", confirmAccount: "", ifscCode: "", beneficiaryName: hospital?.hospitalName || "", tnc: false,
  });
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await getPayoutAccount();
      setAccount(r); setStatus("ready"); setLoadError("");
      if (r?.legalBusinessName) setF((p) => ({ ...p, legalBusinessName: r.legalBusinessName, beneficiaryName: r.beneficiaryName || p.beneficiaryName, ifscCode: r.ifscCode || p.ifscCode }));
    } catch (e: any) {
      if (e?.status === 404) { setStatus("none"); setEditing(true); }
      else { setStatus("error"); setLoadError(e?.status === 503 ? "Payment service is unavailable. Pull to retry." : e?.message || "Unable to load payout account."); }
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const validate = (): string => {
    if (f.legalBusinessName.trim().length < 4) return "Legal business name must be at least 4 characters.";
    if (f.contactName.trim().length < 4) return "Contact name must be at least 4 characters.";
    if (!EMAIL.test(f.email.trim())) return "Enter a valid business email.";
    if (!/^\d{10}$/.test(f.phone)) return "Enter a 10-digit mobile number.";
    if (!f.street1.trim() || !f.city.trim() || !f.state.trim()) return "Complete the registered address.";
    if (!/^[1-9]\d{5}$/.test(f.postalCode)) return "Enter a valid 6-digit PIN code.";
    if (!PAN.test(f.pan)) return "Enter a valid business PAN, e.g. AAACS1234C.";
    if (f.gst && !GST.test(f.gst)) return "Enter a valid GSTIN or leave it blank.";
    if (!f.sName.trim() || !EMAIL.test(f.sEmail.trim())) return "Enter the signatory's name and email.";
    if (f.sPhone && !/^\d{10}$/.test(f.sPhone)) return "Signatory mobile must be 10 digits.";
    if (!PAN.test(f.sPan)) return "Enter the signatory's personal PAN, e.g. ABCPK1234D.";
    if (!/^\d{9,18}$/.test(f.accountNumber)) return "Account number must be 9 to 18 digits.";
    if (f.accountNumber !== f.confirmAccount) return "Account numbers do not match.";
    if (!IFSC.test(f.ifscCode)) return "Enter a valid IFSC, e.g. HDFC0000317.";
    if (!f.beneficiaryName.trim()) return "Beneficiary name is required.";
    if (!f.tnc) return "Accept Razorpay's Route terms to continue.";
    return "";
  };

  const submit = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setSaving(true); setError("");
    try {
      const r = await savePayoutAccount({
        legalBusinessName: f.legalBusinessName.trim(), businessType: f.businessType, contactName: f.contactName.trim(),
        email: f.email.trim(), phone: f.phone,
        address: { street1: f.street1.trim(), street2: f.street2.trim() || null, city: f.city.trim(), state: f.state.trim(), postalCode: f.postalCode },
        pan: f.pan, gst: f.gst || null,
        stakeholder: { name: f.sName.trim(), email: f.sEmail.trim(), phone: f.sPhone || null, pan: f.sPan },
        bankAccount: { accountNumber: f.accountNumber, ifscCode: f.ifscCode, beneficiaryName: f.beneficiaryName.trim() },
        tncAccepted: true,
      });
      setAccount(r); setStatus("ready"); setEditing(false);
      setF((p) => ({ ...p, accountNumber: "", confirmAccount: "" }));
      Alert.alert("Submitted", "Your payout details were sent to Razorpay for verification.");
    } catch (e: any) {
      setError(e?.status === 409 ? "Another update is in progress. Please wait a moment and try again."
        : e?.status === 503 ? "Payment service is unavailable right now. Please retry shortly." : e?.message || "Could not save.");
    } finally { setSaving(false); }
  };

  const st = upper(account?.status);
  const copy = STATUS_COPY[st];

  return (
    <Screen
      title="Payout account" subtitle="Where patient payments are settled" onBack={() => navigation.goBack()} onRefresh={load}
      footer={editing ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {status === "ready" ? <Button style={{ flex: 1 }} variant="ghost" title="Cancel" onPress={() => { setEditing(false); setError(""); }} /> : null}
          <Button style={{ flex: 2 }} title="Submit for verification" icon="shield-checkmark-outline" loading={saving} onPress={submit} />
        </View>
      ) : undefined}
    >
      {status === "loading" ? <Loading /> : null}
      {loadError ? <Banner tone="danger" text={loadError} action={{ label: "Retry", onPress: load }} /> : null}

      {status === "ready" && copy ? (
        <View style={styles.statusCard}>
          <Ionicons name={copy.icon} size={34} color={copy.color} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.statusTitle}>{copy.title}</Text>
              <StatusPill status={st} />
            </View>
            <Text style={styles.statusText}>{copy.text}</Text>
          </View>
        </View>
      ) : null}

      {status === "ready" && account?.requirements?.length ? (
        <Panel title="What to fix" icon="alert-circle-outline">
          {account.requirements.map((r: string) => <Text key={r} style={styles.req}>• {r.replace(/_/g, " ")}</Text>)}
        </Panel>
      ) : null}

      {status === "ready" && !editing ? (
        <>
          <Panel title="Settlement account" icon="card-outline">
            <View style={styles.bank}>
              <Ionicons name="business-outline" size={22} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bankName}>{account.beneficiaryName || "—"}</Text>
                <Text style={styles.bankSub}>A/c •••• {account.bankAccountLast4 || "—"}  ·  {account.ifscCode || "—"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <KV label="Legal name" value={account.legalBusinessName} wide />
              <KV label="Payouts" value={account.payoutsEnabled ? "Enabled" : "Not yet"} />
              <KV label="Activated" value={account.activatedAt ? fmtDate(account.activatedAt) : null} />
              <KV label="Last updated" value={fmtDate(account.updatedAt)} />
            </View>
          </Panel>
          {st !== "SUSPENDED" ? (
            <Button variant="secondary" icon="create-outline" title={st === "ACTIVATED" ? "Change bank account" : "Update details"} onPress={() => setEditing(true)} />
          ) : null}
          <Text style={styles.note}>Only the last 4 digits of your account are stored. Once Razorpay has created your account, only the bank account can be changed here — business details change through Razorpay support.</Text>
        </>
      ) : null}

      {editing ? (
        <>
          {status === "none" ? <Banner tone="primary" text="Set up a payout account to receive your share of online patient payments. Details are verified by Razorpay." /> : null}
          <ErrorText text={error} />
          <Panel title="Business" icon="briefcase-outline">
            <Field label="Legal business name" value={f.legalBusinessName} onChangeText={(v) => set("legalBusinessName", v)} />
            <ChipSelect label="Business type" options={BUSINESS_TYPES} value={f.businessType} onChange={(v) => set("businessType", v)} />
            <Field label="Business PAN" value={f.pan} onChangeText={(v) => set("pan", v.toUpperCase().replace(/\s/g, ""))} autoCapitalize="characters" maxLength={10} placeholder="AAACS1234C" />
            <Field label="GSTIN (optional)" value={f.gst} onChangeText={(v) => set("gst", v.toUpperCase().replace(/\s/g, ""))} autoCapitalize="characters" maxLength={15} />
            <Field label="Contact person" value={f.contactName} onChangeText={(v) => set("contactName", v)} />
            <View style={styles.two}>
              <View style={{ flex: 1 }}><Field label="Email" value={f.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Field label="Mobile" value={f.phone} onChangeText={(v) => set("phone", v.replace(/\D/g, "").slice(0, 10))} keyboardType="number-pad" /></View>
            </View>
          </Panel>
          <Panel title="Registered address" icon="location-outline">
            <Field label="Street 1" value={f.street1} onChangeText={(v) => set("street1", v)} />
            <Field label="Street 2 (optional)" value={f.street2} onChangeText={(v) => set("street2", v)} />
            <View style={styles.two}>
              <View style={{ flex: 1 }}><Field label="City" value={f.city} onChangeText={(v) => set("city", v)} /></View>
              <View style={{ flex: 1 }}><Field label="PIN code" value={f.postalCode} onChangeText={(v) => set("postalCode", v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" /></View>
            </View>
            <Field label="State" value={f.state} onChangeText={(v) => set("state", v)} />
          </Panel>
          <Panel title="Authorised signatory" icon="person-outline">
            <Field label="Full name" value={f.sName} onChangeText={(v) => set("sName", v)} />
            <View style={styles.two}>
              <View style={{ flex: 1 }}><Field label="Email" value={f.sEmail} onChangeText={(v) => set("sEmail", v)} keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Field label="Mobile (optional)" value={f.sPhone} onChangeText={(v) => set("sPhone", v.replace(/\D/g, "").slice(0, 10))} keyboardType="number-pad" /></View>
            </View>
            <Field label="Personal PAN" value={f.sPan} onChangeText={(v) => set("sPan", v.toUpperCase().replace(/\s/g, ""))} autoCapitalize="characters" maxLength={10} placeholder="ABCPK1234D" />
          </Panel>
          <Panel title="Bank account" icon="card-outline">
            <Field label="Account number" value={f.accountNumber} onChangeText={(v) => set("accountNumber", v.replace(/\D/g, "").slice(0, 18))} keyboardType="number-pad" secureTextEntry />
            <Field label="Confirm account number" value={f.confirmAccount} onChangeText={(v) => set("confirmAccount", v.replace(/\D/g, "").slice(0, 18))} keyboardType="number-pad" />
            <View style={styles.two}>
              <View style={{ flex: 1 }}><Field label="IFSC" value={f.ifscCode} onChangeText={(v) => set("ifscCode", v.toUpperCase().replace(/\s/g, ""))} autoCapitalize="characters" maxLength={11} placeholder="HDFC0000317" /></View>
              <View style={{ flex: 1 }}><Field label="Beneficiary name" value={f.beneficiaryName} onChangeText={(v) => set("beneficiaryName", v)} /></View>
            </View>
          </Panel>
          <Pressable style={styles.tnc} onPress={() => set("tnc", !f.tnc)}>
            <Ionicons name={f.tnc ? "checkbox" : "square-outline"} size={22} color={f.tnc ? C.primary : C.gray} />
            <Text style={styles.tncText}>I accept Razorpay's Route terms and confirm these details are correct.</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 16, marginBottom: 12 },
  statusTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  statusText: { fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 18 },
  req: { fontSize: 13, color: C.ink, paddingVertical: 4 },
  bank: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, backgroundColor: C.primarySoft, marginVertical: 6 },
  bankName: { fontSize: 15, fontWeight: "800", color: C.ink },
  bankSub: { fontSize: 12.5, color: C.muted, marginTop: 2, letterSpacing: 0.3 },
  note: { fontSize: 11.5, color: C.muted, lineHeight: 16, marginTop: 12 },
  two: { flexDirection: "row", gap: 10 },
  tnc: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 4, marginTop: 4 },
  tncText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 19 },
});
