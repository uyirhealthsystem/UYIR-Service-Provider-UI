import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

import { getReferrals } from "../../../api/referrals";
import { colors, spacing, typography } from "../../../theme";
import {
  Card,
  EmptyState,
  ErrorBanner,
  FilterChips,
  IconBadge,
  LoadingView,
  Pill,
  Screen,
  ScreenHeader,
} from "../../../ui/components";
import {
  formatDate,
  listFrom,
  money,
  REFERRAL_STATUS,
  referralStatus,
  referralType,
  shortId,
  type ReferralStatus,
} from "../../../ui/format";

// GET /referrals -> [{ id, referredUserId, referredType (CITIZEN |
// HEALTH_PARTNER), status (PENDING | COMPLETED | CANCELLED), rewardAmount,
// createdAt, completedAt }], newest first.

type Filter = "ALL" | ReferralStatus;

export default function Referrals({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loaded = useRef(false);

  const load = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      setError("");
      setItems(listFrom(await getReferrals()));
      loaded.current = true;
    } catch (loadError: any) {
      console.log("HP referrals error:", loadError);
      setError(loadError?.message || "Unable to load referrals.");
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

  const counts = useMemo(() => {
    const result: Record<ReferralStatus, number> = { COMPLETED: 0, PENDING: 0, CANCELLED: 0 };
    for (const item of items) result[referralStatus(item.status)] += 1;
    return result;
  }, [items]);

  const earned = useMemo(
    () => items.filter((item) => referralStatus(item.status) === "COMPLETED").reduce((sum, item) => sum + Number(item.rewardAmount || 0), 0),
    [items],
  );

  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((item) => referralStatus(item.status) === filter)),
    [items, filter],
  );

  if (loading && !loaded.current) return <LoadingView label="Loading referrals..." />;

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <ScreenHeader title="My referrals" subtitle="Everyone who joined with your code." />

      {/* Summary strip */}
      <Card style={{ flexDirection: "row", paddingVertical: spacing.md }}>
        <Summary label="Completed" value={counts.COMPLETED} color={colors.green} />
        <Divider />
        <Summary label="Pending" value={counts.PENDING} color={colors.amber} />
        <Divider />
        <Summary label="Earned" value={money(earned, { decimals: 0 })} color={colors.brand} />
      </Card>

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md, marginHorizontal: -spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.xl }}>
          <FilterChips<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "ALL", label: `All · ${items.length}` },
              { value: "COMPLETED", label: `Completed · ${counts.COMPLETED}` },
              { value: "PENDING", label: `Pending · ${counts.PENDING}` },
              { value: "CANCELLED", label: `Cancelled · ${counts.CANCELLED}` },
            ]}
          />
        </View>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => load(true)} /> : null}

      {!filtered.length && !error ? (
        items.length ? (
          <EmptyState icon="filter-outline" title="Nothing here" message="No referrals match this filter." actionLabel="Show all" onAction={() => setFilter("ALL")} />
        ) : (
          <EmptyState
            icon="people-outline"
            title="No referrals yet"
            message="Share your referral code with citizens and Health Partners. Everyone who joins with it appears here."
            actionLabel="Share my code"
            onAction={() => navigation.navigate("ReferHub")}
          />
        )
      ) : null}

      {filtered.map((item, index) => {
        const statusKey = referralStatus(item.status);
        const status = REFERRAL_STATUS[statusKey];
        const type = referralType(item.referredType);
        const isCitizen = type.label === "Citizen";
        const note =
          statusKey === "COMPLETED"
            ? `+${money(item.rewardAmount)} earned`
            : statusKey === "PENDING"
              ? isCitizen
                ? "Waiting for ABHA link"
                : "Processing"
              : "No reward";

        return (
          <Card
            key={item.id || index}
            onPress={() => navigation.navigate("ReferralDetails", { referral: item })}
            accessibilityLabel={`${type.label} referral ${shortId(item.referredUserId)}, ${status.label}, ${note}`}
            style={{ marginBottom: spacing.md }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <IconBadge icon={type.icon} tone={type.tone} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={typography.label}>
                  {type.label} {shortId(item.referredUserId)}
                </Text>
                <Text style={[typography.caption, { marginTop: 2 }]}>Joined {formatDate(item.createdAt)}</Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: "700",
                    color: statusKey === "COMPLETED" ? colors.green : statusKey === "PENDING" ? colors.amber : colors.muted,
                  }}
                >
                  {note}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
                <Pill label={status.label} tone={status.tone} icon={status.icon} />
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

function Summary({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[typography.caption, { marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, alignSelf: "stretch", backgroundColor: colors.divider }} />;
}
