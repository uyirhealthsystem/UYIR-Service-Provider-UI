import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors, HP_RULES, spacing, typography } from "../../../theme";
import { Card, ErrorBanner, ReferralCodeCard, Screen, ScreenHeader, Steps } from "../../../ui/components";
import { money } from "../../../ui/format";
import { useReferralCode } from "../useReferralCode";

// Citizen referral flow (HP service README, "Citizen referrals"):
// villager creates a profile with the code -> PENDING; villager links their
// own ABHA -> COMPLETED and the reward lands in the HP's wallet.

export default function ReferCitizen({ navigation }: any) {
  const { code, error, retry } = useReferralCode();
  const reward = money(HP_RULES.rewardPerReferral, { decimals: 0 });

  return (
    <Screen>
      <ScreenHeader
        title="Refer a citizen"
        subtitle="Help someone in your village get started with the Uyir app."
        onBack={() => navigation.goBack()}
      />
      {error ? <ErrorBanner message={error} onRetry={retry} /> : null}

      <ReferralCodeCard
        code={code}
        shareLabel="Share with citizen"
        caption="Ask them to enter this code when they create their profile in the Uyir app."
        message={`Download the Uyir app for easy access to healthcare. When you create your profile, enter my Health Partner code ${code}.`}
      />

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={[typography.heading, { marginBottom: spacing.lg }]}>How it works</Text>
        <Steps
          items={[
            { title: "Share your code", detail: "Send it with the share button or tell them in person." },
            { title: "They install the Uyir app", detail: "and create their profile with your code." },
            { title: "They link their ABHA", detail: "An existing ABHA, or one they create in the app." },
            { title: `You earn ${reward}`, detail: "Credited to your wallet once the ABHA is linked." },
          ]}
        />
      </Card>

      <Card style={{ marginTop: spacing.md, backgroundColor: colors.amberSoft, borderColor: colors.amberSoft }}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Ionicons name="bulb-outline" size={20} color={colors.amber} />
          <Text style={[typography.body, { flex: 1, color: colors.amber }]}>
            Until the ABHA is linked, the referral shows as Pending. Help them link it to get your reward sooner.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
