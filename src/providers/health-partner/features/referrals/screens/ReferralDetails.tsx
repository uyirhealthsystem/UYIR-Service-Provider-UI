import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors, spacing, typography } from "../../../theme";
import { Card, DetailRow, IconBadge, Pill, Screen, ScreenHeader, toneColors } from "../../../ui/components";
import {
  formatDateTime,
  money,
  REFERRAL_STATUS,
  referralStatus,
  referralType,
  shortId,
} from "../../../ui/format";

// Shows one row from GET /referrals (passed in as route.params.referral).

export default function ReferralDetails({ route, navigation }: any) {
  const item = route.params?.referral || {};
  const statusKey = referralStatus(item.status);
  const status = REFERRAL_STATUS[statusKey];
  const type = referralType(item.referredType);
  const isCitizen = type.label === "Citizen";

  const explanation = {
    COMPLETED: `This referral is complete. ${money(item.rewardAmount)} was added to your wallet.`,
    PENDING: isCitizen
      ? "They signed up with your code. You'll be paid as soon as they link their ABHA in the Uyir app."
      : "This referral is being processed.",
    CANCELLED: "They deleted their account before linking their ABHA, so no reward was paid.",
  }[statusKey];

  // Timeline: signed up -> ABHA linked (citizens only) -> reward credited.
  const steps = [
    { title: "Signed up with your code", time: item.createdAt, done: true },
    ...(isCitizen ? [{ title: "Linked their ABHA", time: item.completedAt, done: statusKey === "COMPLETED" }] : []),
    { title: "Reward credited to wallet", time: item.completedAt, done: statusKey === "COMPLETED" },
  ];

  return (
    <Screen>
      <ScreenHeader title="Referral details" onBack={() => navigation.goBack()} />

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <IconBadge icon={type.icon} tone={type.tone} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={typography.heading}>
              {type.label} {shortId(item.referredUserId)}
            </Text>
            <Text style={[typography.caption, { marginTop: 2 }]}>{type.label} referral</Text>
          </View>
          <Pill label={status.label} tone={status.tone} icon={status.icon} />
        </View>
        <View
          style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: 12,
            backgroundColor: toneColors(status.tone).bg,
          }}
        >
          <Text style={{ color: toneColors(status.tone).fg, fontSize: 13, lineHeight: 19 }}>{explanation}</Text>
        </View>
      </Card>

      {statusKey !== "CANCELLED" ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[typography.heading, { marginBottom: spacing.lg }]}>Progress</Text>
          {steps.map((step, index) => (
            <View key={step.title} style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ alignItems: "center" }}>
                <Ionicons
                  name={step.done ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={step.done ? colors.green : colors.border}
                />
                {index < steps.length - 1 ? (
                  <View style={{ width: 2, flex: 1, minHeight: 16, backgroundColor: step.done ? colors.greenSoft : colors.divider }} />
                ) : null}
              </View>
              <View style={{ flex: 1, paddingBottom: index < steps.length - 1 ? spacing.lg : 0, paddingTop: 2 }}>
                <Text style={[typography.label, !step.done && { color: colors.muted }]}>{step.title}</Text>
                <Text style={[typography.caption, { marginTop: 2 }]}>{step.done && step.time ? formatDateTime(step.time) : "Not yet"}</Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={{ marginTop: spacing.md, paddingVertical: spacing.xs }}>
        <DetailRow label="Type" value={type.label} />
        <DetailRow label="Referral ID" value={shortId(item.id)} />
        <DetailRow label="Joined on" value={formatDateTime(item.createdAt)} />
        {item.completedAt ? <DetailRow label="Completed on" value={formatDateTime(item.completedAt)} /> : null}
        <DetailRow label="Reward" value={statusKey === "COMPLETED" ? money(item.rewardAmount) : "Not paid yet"} last />
      </Card>
    </Screen>
  );
}
