import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { claimHospital } from "../../../api/hospital";
import { Banner, Button, C } from "../../../components/ui";

// Shown by HospitalGate when this HOSPITAL login has no hospital yet (GET /me -> 404).
// A PRO onboarded the hospital, and the hospital service emailed its contact address the Hospital ID and a
// one-time claim code (8 characters, valid 7 days, 5 attempts). POST /hospital/claim links this account;
// onClaimed() then reloads the gate, which opens the hospital portal.

const CODE_LENGTH = 8;

/** Keep letters and digits only, upper-case, and show it as XXXX-XXXX while typing. */
function formatCode(input: string) {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
  return raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
}

export default function ClaimHospital({ onClaimed, onLogout }: { onClaimed: () => void; onLogout: () => void }) {
  const [hospitalId, setHospitalId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [linked, setLinked] = useState<string | null>(null);

  const rawCode = code.replace(/-/g, "");
  const ready = hospitalId.trim().length > 0 && rawCode.length === CODE_LENGTH;

  const submit = async () => {
    if (!ready || loading) return;
    try {
      setLoading(true);
      setError("");
      const hospital = await claimHospital(hospitalId, rawCode);
      setLinked(hospital?.hospitalName || "your hospital");
      // Give the confirmation a moment, then open the portal.
      setTimeout(onClaimed, 1200);
    } catch (e: any) {
      const status = e?.status;
      setLocked(status === 429);
      setError(
        status === 404
          ? "No hospital found with this ID. Copy it exactly from the email."
          : e?.message || "Couldn't link the hospital. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (linked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: C.successSoft, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="checkmark-circle" size={52} color={C.success} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.ink, marginTop: 18, textAlign: "center" }}>Hospital linked</Text>
        <Text style={{ fontSize: 14, color: C.muted, marginTop: 6, textAlign: "center" }}>{linked} is now managed by this account.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="link" size={30} color={C.primary} />
          </View>
          <Text style={{ fontSize: 26, fontWeight: "800", color: C.ink, marginTop: 18 }}>Link your hospital</Text>
          <Text style={{ fontSize: 14, color: C.muted, lineHeight: 21, marginTop: 6 }}>
            Our field officer registered your hospital on Uyir and emailed your hospital's address a{" "}
            <Text style={{ fontWeight: "700", color: C.ink }}>Hospital ID</Text> and a{" "}
            <Text style={{ fontWeight: "700", color: C.ink }}>claim code</Text>. Enter both to manage the hospital from this account.
          </Text>

          <View style={{ marginTop: 26, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 18 }}>
            <Text style={labelStyle}>Hospital ID</Text>
            <TextInput
              value={hospitalId}
              onChangeText={(v) => { setHospitalId(v.replace(/\s/g, "")); setError(""); }}
              placeholder="Paste the Hospital ID from the email"
              placeholderTextColor="#9AA6B7"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={inputStyle}
            />

            <Text style={[labelStyle, { marginTop: 16 }]}>Claim code</Text>
            <TextInput
              value={code}
              onChangeText={(v) => { setCode(formatCode(v)); setError(""); setLocked(false); }}
              placeholder="XXXX-XXXX"
              placeholderTextColor="#9AA6B7"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={CODE_LENGTH + 1}
              editable={!loading}
              style={[inputStyle, { fontSize: 22, fontWeight: "800", letterSpacing: 4, textAlign: "center" }]}
            />
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>8 letters and numbers. It works once and expires after 7 days.</Text>

            {error ? <View style={{ marginTop: 14 }}><Banner tone={locked ? "warn" : "danger"} text={error} /></View> : null}

            <Button title="Link hospital" icon="link" onPress={submit} loading={loading} disabled={!ready} style={{ marginTop: 16 }} />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: C.primarySoft }}>
            <Ionicons name="mail-unread-outline" size={20} color={C.primary} />
            <Text style={{ flex: 1, fontSize: 13, color: C.ink, lineHeight: 19 }}>
              Can't find the email? Check spam, or ask your Uyir field officer to send a new code - it replaces the old one.
            </Text>
          </View>

          <Pressable onPress={onLogout} style={{ alignItems: "center", marginTop: 24, padding: 8 }}>
            <Text style={{ color: C.muted, fontWeight: "700" }}>Log out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const labelStyle = { fontSize: 13, fontWeight: "700" as const, color: C.ink, marginBottom: 8 };
const inputStyle = {
  minHeight: 52,
  borderWidth: 1,
  borderColor: C.line,
  borderRadius: 12,
  paddingHorizontal: 14,
  fontSize: 15,
  color: C.ink,
  backgroundColor: C.bg,
};
