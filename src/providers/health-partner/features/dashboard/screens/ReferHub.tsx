import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors, HP_RULES, spacing, typography } from "../../../theme";
import { Card, ErrorBanner, IconBadge, ReferralCodeCard, Screen, ScreenHeader } from "../../../ui/components";
import { money } from "../../../ui/format";
import { useReferralCode } from "../useReferralCode";

export default function ReferHub({ navigation }: any) {
  const { code, error, retry } = useReferralCode();
  const reward = money(HP_RULES.rewardPerReferral, { decimals: 0 });

  return (
    <Screen>
      <ScreenHeader title="Refer & earn" subtitle={`Earn ${reward} for every successful referral.`} onBack={() => navigation.goBack()} />
      {error ? <ErrorBanner message={error} onRetry={retry} /> : null}

      <ReferralCodeCard code={code} message={`Join Uyir using my Health Partner code ${code}.`} />

      <Text style={[typography.heading, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Who do you want to refer?</Text>
      <Option
        icon="person-add"
        tone="brand"
        title="A citizen"
        caption="Someone in your village who should use the Uyir app."
        onPress={() => navigation.navigate("ReferCitizen")}
      />
      <Option
        icon="people"
        tone="violet"
        title="A Health Partner"
        caption="Someone who wants to work as a Health Partner like you."
        onPress={() => navigation.navigate("ReferHealthPartner")}
      />
    </Screen>
  );
}

function Option({
  icon,
  tone,
  title,
  caption,
  onPress,
}: {
  icon: "person-add" | "people";
  tone: "brand" | "violet";
  title: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={title} style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <IconBadge icon={icon} tone={tone} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={typography.label}>{title}</Text>
          <Text style={[typography.caption, { marginTop: 2, lineHeight: 17 }]}>{caption}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Card>
  );
}
