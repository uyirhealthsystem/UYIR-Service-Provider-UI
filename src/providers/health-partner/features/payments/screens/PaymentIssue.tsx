import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";

import { colors, HP_RULES, spacing, typography } from "../../../theme";
import { Banner, Button, Card, Field, Screen, ScreenHeader, SelectField, OptionSheet } from "../../../ui/components";
import { money } from "../../../ui/format";

// Payment help. The HP service has no support / ticket API, so instead of a
// form that pretends to submit, this answers the common questions and lets
// the HP send a ready-written message to their coordinator through the share
// sheet (WhatsApp, SMS, email...).

const reward = money(HP_RULES.rewardPerReferral, { decimals: 0 });

const FAQ = [
  {
    q: "My citizen referral is still Pending",
    a: `Citizen rewards are paid only after the person links their ABHA in the Uyir app. Help them link it and the ${reward} reward is credited automatically.`,
  },
  {
    q: "I referred a Health Partner but got nothing",
    a: "The new partner must type your code while creating their Health Partner profile. A code can't be added after the profile is created.",
  },
  {
    q: "My withdrawal says Requested",
    a: "Withdrawals are reviewed and sent to your bank account. Check that your bank account and IFSC are correct under Bank account.",
  },
  {
    q: "A referral says Cancelled",
    a: "The person deleted their Uyir account before linking their ABHA, so no reward is paid.",
  },
];

const ISSUE_TYPES = [
  { id: "Reward not received", name: "Reward not received" },
  { id: "Wrong amount", name: "Wrong amount" },
  { id: "Withdrawal problem", name: "Withdrawal problem" },
  { id: "Other", name: "Other" },
];

export default function PaymentIssue({ navigation }: any) {
  const [open, setOpen] = useState<number | null>(0);
  const [issueType, setIssueType] = useState("");
  const [picker, setPicker] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const send = async () => {
    if (!issueType) {
      setError("Choose what the problem is about.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Add a few words describing the problem.");
      return;
    }
    setError("");
    try {
      await Share.share({
        message: `Uyir Health Partner - payment issue\nType: ${issueType}\n\n${description.trim()}`,
      });
    } catch (e) {
      console.log("HP payment issue share error:", e);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Payment help" subtitle="Answers to common questions about rewards and withdrawals." onBack={() => navigation.goBack()} />

      <Card padded={false}>
        {FAQ.map((item, index) => {
          const expanded = open === index;
          return (
            <View key={item.q} style={{ borderBottomWidth: index === FAQ.length - 1 ? 0 : 1, borderBottomColor: colors.divider }}>
              <Pressable
                onPress={() => setOpen(expanded ? null : index)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg }}
              >
                <Text style={[typography.label, { flex: 1 }]}>{item.q}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
              </Pressable>
              {expanded ? <Text style={[typography.body, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, marginTop: -spacing.xs }]}>{item.a}</Text> : null}
            </View>
          );
        })}
      </Card>

      <Text style={[typography.heading, { marginTop: spacing.xl }]}>Still need help?</Text>
      <Text style={[typography.body, { marginTop: 4, marginBottom: spacing.md }]}>
        Describe the problem and send it to your coordinator. We'll open your share options (WhatsApp, SMS or email).
      </Text>

      <Card>
        <SelectField
          label="What is it about?"
          required
          icon="pricetag-outline"
          value={issueType}
          placeholder="Choose an issue type"
          onPress={() => setPicker(true)}
        />
        <Field
          label="Describe the problem"
          required
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            setError("");
          }}
          placeholder="e.g. My referral on 12 Nov shows completed but the reward isn't in my wallet."
          multiline
          maxLength={500}
          hint={`${description.length}/500`}
        />
        {error ? <Banner message={error} style={{ marginBottom: spacing.lg }} /> : null}
        <Button label="Send to coordinator" icon="paper-plane-outline" onPress={send} />
      </Card>

      <OptionSheet
        visible={picker}
        title="What is it about?"
        options={ISSUE_TYPES}
        selectedId={issueType}
        onSelect={(id) => {
          setIssueType(id);
          setError("");
          setPicker(false);
        }}
        onClose={() => setPicker(false)}
      />
    </Screen>
  );
}
