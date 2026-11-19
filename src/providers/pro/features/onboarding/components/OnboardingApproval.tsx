import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { extractHospitalId, resendHospitalClaimCode } from "../../../api/onboarding";
import { colors, radius, spacing, typography } from "../../../theme";
import { Button, Card, ErrorBanner } from "../../../ui/components";

// Shown after OnboardingPreview has created the hospital (as the PRO - unowned), registered the doctor and
// marked the bucket entry ONBOARDED. The hospital service emailed the hospital its ID and a one-time claim
// code; the hospital's own account uses them to take over (see hospital ClaimHospital screen).

export default function OnboardingApproval({ navigation, route }: any) {
  const doctor = route.params?.doctorResponse || {};
  const [hospital, setHospital] = useState<any>(route.params?.hospitalResponse || {});
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const hospitalId = extractHospitalId(hospital);
  const hospitalName = hospital?.hospitalName || hospital?.name || "The hospital";
  const sentTo: string | null = hospital?.claimCodeSentTo || null;
  const expires = hospital?.claimCodeExpiresAt
    ? new Date(hospital.claimCodeExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const resend = async () => {
    if (!hospitalId || resending) return;
    try {
      setResending(true);
      setError("");
      setNotice("");
      const updated = await resendHospitalClaimCode(hospitalId);
      setHospital((current: any) => ({ ...current, ...updated }));
      setNotice(`A new code was sent${updated?.claimCodeSentTo ? ` to ${updated.claimCodeSentTo}` : ""}. The old code no longer works.`);
    } catch (e: any) {
      setError(e?.message || "Couldn't resend the code.");
    } finally {
      setResending(false);
    }
  };

  const steps = [
    { icon: "business", text: `${hospitalName} was created in Uyir` },
    { icon: "person-add", text: doctor?.name ? `Dr. ${doctor.name} was registered with the hospital` : "The doctor was registered with the hospital" },
    { icon: "ribbon", text: "It now counts toward your onboarded hospitals" },
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl }}>
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="checkmark" size={40} color={colors.white} />
            </View>
          </View>
          <Text style={[typography.title, { marginTop: spacing.xl, textAlign: "center" }]}>Hospital onboarded!</Text>
          <Text style={[typography.body, { marginTop: spacing.sm, textAlign: "center" }]}>Great work. Here's what just happened:</Text>
        </View>

        <Card style={{ marginTop: spacing.xl }}>
          {steps.map((step, index) => (
            <View key={step.text} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: index ? 1 : 0, borderTopColor: colors.divider }}>
              <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={step.icon} size={18} color={colors.green} />
              </View>
              <Text style={[typography.label, { flex: 1 }]}>{step.text}</Text>
            </View>
          ))}
        </Card>

        {/* Handover to the hospital */}
        <Card style={{ marginTop: spacing.lg, borderColor: sentTo ? colors.border : "#F6C9C5" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name={sentTo ? "mail" : "mail-unread-outline"} size={20} color={sentTo ? colors.brand : colors.red} />
            <Text style={[typography.heading, { flex: 1 }]}>Hand over to the hospital</Text>
          </View>
          {sentTo ? (
            <Text style={[typography.body, { marginTop: spacing.sm }]}>
              We emailed the Hospital ID and a one-time claim code to <Text style={{ fontWeight: "700", color: colors.text }}>{sentTo}</Text>
              {expires ? ` (valid until ${expires})` : ""}. Ask the hospital to register in the app as a Hospital and enter both to take over its account.
            </Text>
          ) : (
            <Text style={[typography.body, { marginTop: spacing.sm, color: colors.red }]}>
              No claim code was sent because the hospital has no email address. Ask Uyir support to add the email and send the code.
            </Text>
          )}
          {hospitalId ? (
            <View style={{ marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }}>
              <Text style={typography.overline}>HOSPITAL ID</Text>
              <Text selectable style={{ marginTop: 4, fontSize: 15, fontWeight: "700", color: colors.text, fontFamily: "monospace" }}>{hospitalId}</Text>
              <Text style={[typography.caption, { marginTop: 4 }]}>The claim code is only in the hospital's email - never share it on the PRO's behalf.</Text>
            </View>
          ) : null}
          {notice ? (
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.greenSoft }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={{ flex: 1, color: colors.green, fontSize: 13, fontWeight: "600" }}>{notice}</Text>
            </View>
          ) : null}
          {error ? <ErrorBanner message={error} /> : null}
          {sentTo && hospitalId ? (
            <Button label="Resend code" icon="refresh" variant="secondary" compact onPress={resend} loading={resending} style={{ marginTop: spacing.md }} />
          ) : null}
        </Card>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button label="Visit next hospital" icon="briefcase" onPress={() => navigation.navigate("ProLayout", { screen: "Bucket" })} />
          <Button label="See onboarded hospitals" icon="ribbon-outline" variant="ghost" onPress={() => navigation.navigate("ProLayout", { screen: "Onboarded" })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
