import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { getDashboard } from "../../../api/healthPartner";
import { getReferrals } from "../../../api/referrals";
import { colors, HP_RULES, spacing, typography } from "../../../theme";
import {
  Avatar,
  Banner,
  Card,
  ErrorBanner,
  IconBadge,
  LoadingView,
  Pill,
  ReferralCodeCard,
  Screen,
  SectionHeader,
  StatTile,
  type IconName,
  type Tone,
} from "../../../ui/components";
import {
  formatDate,
  greeting,
  initials,
  listFrom,
  money,
  REFERRAL_STATUS,
  referralStatus,
  referralType,
  shortId,
} from "../../../ui/format";

// Home: the referral code front and centre, how referrals are going, the
// wallet, and the latest few referrals. Two calls:
//   GET /health-partners/dashboard -> { fullName, referralCode, totalReferrals
//     (completed), pendingReferrals, totalEarnings, walletBalance, status }
//   GET /referrals -> newest first

export default function Dashboard({ navigation }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loaded = useRef(false);

  const load = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      setError("");
      const [dashboardData, referralData] = await Promise.all([
        getDashboard(),
        getReferrals().catch(() => null),
      ]);
      setDashboard(dashboardData);
      if (referralData) setRecent(listFrom(referralData).slice(0, 3));
      loaded.current = true;
    } catch (loadError: any) {
      console.log("HP dashboard error:", loadError);
      setError(loadError?.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && !loaded.current) return <LoadingView label="Loading your dashboard..." />;

  const name = String(dashboard?.fullName || "Health Partner");
  const firstName = name.split(" ")[0];
  const code = dashboard?.referralCode;
  const completed = Number(dashboard?.totalReferrals ?? 0);
  const pending = Number(dashboard?.pendingReferrals ?? 0);
  const inactive = String(dashboard?.status || "").toUpperCase() === "INACTIVE";

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={typography.caption}>{greeting()},</Text>
          <Text style={[typography.display, { marginTop: 2 }]} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Profile")} accessibilityRole="button" accessibilityLabel="Open profile">
          <Avatar label={initials(name)} size={46} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg }}>
        <Pill label="Health Partner" tone="brand" icon="shield-checkmark" />
        {inactive ? <Pill label="Inactive" tone="neutral" /> : null}
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => load(true)} /> : null}
      {inactive ? (
        <Banner
          tone="amber"
          message="Your account is inactive. New Health Partners can't sign up with your code until it's active again."
          style={{ marginBottom: spacing.md }}
        />
      ) : null}

      <ReferralCodeCard
        code={code}
        message={`Join Uyir and get easy access to healthcare. Use my Health Partner code ${code} when you create your profile.`}
        caption={`Earn ${money(HP_RULES.rewardPerReferral, { decimals: 0 })} for every successful referral.`}
      />

      {/* Refer actions */}
      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
        <ActionCard
          icon="person-add"
          tone="brand"
          title="Refer a citizen"
          caption="Help a villager join Uyir"
          onPress={() => navigation.navigate("ReferCitizen")}
        />
        <ActionCard
          icon="people"
          tone="blue"
          title="Refer a partner"
          caption="Grow the HP network"
          onPress={() => navigation.navigate("ReferHealthPartner")}
        />
      </View>

      {/* Stats */}
      <SectionHeader title="Your progress" caption="Updated when you open this screen" />
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatTile
          icon="checkmark-done"
          tone="green"
          label="Successful referrals"
          value={completed}
          onPress={() => navigation.navigate("Referrals")}
        />
        <StatTile
          icon="hourglass-outline"
          tone="amber"
          label="Awaiting ABHA link"
          value={pending}
          onPress={() => navigation.navigate("Referrals")}
        />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
        <StatTile icon="trending-up" tone="violet" label="Total earned" value={money(dashboard?.totalEarnings)} />
        <StatTile
          icon="wallet"
          tone="brand"
          label="Wallet balance"
          value={money(dashboard?.walletBalance)}
          hint="Withdraw"
          onPress={() => navigation.navigate("Payments")}
        />
      </View>

      {/* Recent referrals */}
      <SectionHeader
        title="Recent referrals"
        actionLabel={recent.length ? "See all" : undefined}
        onAction={() => navigation.navigate("Referrals")}
      />
      {recent.length ? (
        <Card padded={false}>
          {recent.map((item, index) => {
            const status = REFERRAL_STATUS[referralStatus(item.status)];
            const type = referralType(item.referredType);
            return (
              <Pressable
                key={item.id || index}
                onPress={() => navigation.navigate("ReferralDetails", { referral: item })}
                accessibilityRole="button"
                accessibilityLabel={`${type.label} referral, ${status.label}`}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderBottomWidth: index === recent.length - 1 ? 0 : 1,
                  borderBottomColor: colors.divider,
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                })}
              >
                <IconBadge icon={type.icon} tone={type.tone} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.label}>
                    {type.label} {shortId(item.referredUserId)}
                  </Text>
                  <Text style={[typography.caption, { marginTop: 2 }]}>{formatDate(item.createdAt)}</Text>
                </View>
                <Pill label={status.label} tone={status.tone} icon={status.icon} />
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <IconBadge icon="sparkles-outline" tone="brand" />
            <View style={{ flex: 1 }}>
              <Text style={typography.label}>No referrals yet</Text>
              <Text style={[typography.caption, { marginTop: 2, lineHeight: 17 }]}>
                Share your code with families in your village. Their sign-ups will show up here.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* How you earn */}
      <Card style={{ marginTop: spacing.xl, backgroundColor: colors.brandSoft, borderColor: colors.brandSoft }}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Ionicons name="information-circle" size={22} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.label, { color: colors.brandDark }]}>How you earn</Text>
            <Text style={[typography.body, { marginTop: 4, color: colors.brandDark }]}>
              A citizen referral is paid once the person creates their profile with your code and links their ABHA. A
              Health Partner referral is paid as soon as they register.
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

function ActionCard({
  icon,
  tone,
  title,
  caption,
  onPress,
}: {
  icon: IconName;
  tone: Tone;
  title: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={title} style={{ flex: 1, padding: 14 }}>
      <IconBadge icon={icon} tone={tone} size={40} />
      <Text style={[typography.label, { marginTop: spacing.md }]}>{title}</Text>
      <Text style={[typography.caption, { marginTop: 2 }]}>{caption}</Text>
    </Card>
  );
}
