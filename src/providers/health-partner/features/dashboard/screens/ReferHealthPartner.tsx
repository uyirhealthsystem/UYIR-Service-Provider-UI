import { Text } from "react-native";

import { HP_RULES, spacing, typography } from "../../../theme";
import { Card, ErrorBanner, ReferralCodeCard, Screen, ScreenHeader, Steps } from "../../../ui/components";
import { money } from "../../../ui/format";
import { useReferralCode } from "../useReferralCode";

// HP-to-HP referral: the new partner enters the code while creating their HP
// profile; the service records a COMPLETED referral and credits the reward in
// the same transaction (health-partner.service.ts createHealthPartner).

export default function ReferHealthPartner({ navigation }: any) {
  const { code, error, retry } = useReferralCode();
  const reward = money(HP_RULES.rewardPerReferral, { decimals: 0 });

  return (
    <Screen>
      <ScreenHeader
        title="Refer a Health Partner"
        subtitle="Invite someone who wants to serve their community as a Health Partner."
        onBack={() => navigation.goBack()}
      />
      {error ? <ErrorBanner message={error} onRetry={retry} /> : null}

      <ReferralCodeCard
        code={code}
        shareLabel="Share invite"
        caption="They enter this code while creating their Health Partner profile."
        message={`Become a Uyir Health Partner and help your community access healthcare. Download the Uyir Service Provider app, register as a Health Partner and enter my referral code ${code}.`}
      />

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={[typography.heading, { marginBottom: spacing.lg }]}>How it works</Text>
        <Steps
          items={[
            { title: "Share your code", detail: "Send the invite with the share button." },
            { title: "They register as a Health Partner", detail: "in the Uyir Service Provider app." },
            { title: "They enter your code", detail: "on the Create Health Partner Profile screen." },
            { title: `You earn ${reward} instantly`, detail: "Credited to your wallet as soon as their profile is created." },
          ]}
        />
      </Card>
    </Screen>
  );
}
