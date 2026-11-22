import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDashboard } from "../../../api/dashboard";
import { getMyProfile } from "../../../api/profile";
import { colors, PRO_RULES, radius, shadow, spacing, typography } from "../../../theme";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  HeaderIconButton,
  IconBadge,
  Pill,
  ProgressBar,
  SectionHeader,
  SlotMeter,
  type Tone,
} from "../../../ui/components";
import { greeting, initials, proIdFrom, splitHospitalName, timeLeft, urgencyTone } from "../../../ui/format";

// Home: what to do next, how today is going, and what's in the bucket.
// Everything comes from one call, GET /pro/:proId/dashboard
// -> { pro, metrics, dailyProgress, weeklyProgress, bucket, checkpoints }.

export default function Dashboard({ navigation }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const loaded = useRef(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      setError("");
      const proId = proIdFrom(await getMyProfile());
      if (!proId) throw new Error("Your PRO profile could not be found. Please log in again.");
      const response = await getDashboard(proId);
      setData(response?.data || response || null);
      loaded.current = true;
    } catch (e: any) {
      console.log("Dashboard API error:", e);
      if (!loaded.current) setError(e?.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(loaded.current);
    }, [load]),
  );

  // Countdowns tick once a minute on Home (the Bucket screen ticks every second).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const pro = data?.pro || {};
  const metrics = data?.metrics || {};
  const daily = data?.dailyProgress || {};
  const weekly = data?.weeklyProgress || {};
  const bucketHospitals: any[] = Array.isArray(data?.bucket?.hospitals) ? data.bucket.hospitals : [];
  const overdue: any[] = Array.isArray(data?.checkpoints) ? data.checkpoints : [];
  const bucketSize = data?.bucket?.bucketSize || PRO_RULES.bucketSize;
  const used = data?.bucket?.activeBucketCount ?? bucketHospitals.length;

  const dailyTarget = daily.target || PRO_RULES.dailyTarget;
  const dailyDone = daily.onboarded || 0;
  const weeklyTarget = weekly.target || PRO_RULES.weeklyTarget;
  const weeklyDone = weekly.onboarded || 0;

  // Most urgent hospital still inside its visit window.
  const upcoming = [...bucketHospitals]
    .filter((h) => !timeLeft(h.blockExpiresAt, now).expired)
    .sort((a, b) => new Date(a.blockExpiresAt).getTime() - new Date(b.blockExpiresAt).getTime());
  const next = upcoming[0];

  const openVisit = (h: any) =>
    navigation.getParent()?.navigate("HospitalVisit", {
      hospitalId: h.hospitalId || h.hospitalPoolId,
      hospitalPoolId: h.hospitalPoolId,
      proHospitalId: h.proHospitalId,
    });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={[typography.caption, { marginTop: spacing.md }]}>Loading your day…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.brand }} edges={["top"]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.white} colors={[colors.brand]} progressBackgroundColor={colors.white} />}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <View style={{ backgroundColor: colors.brand, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: 72, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" }}>
              <Text style={{ color: colors.white, fontWeight: "800", fontSize: 16 }}>{initials(pro.name)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ color: colors.brandOnDark, fontSize: 13, fontWeight: "600" }}>{greeting()},</Text>
              <Text style={{ color: colors.white, fontSize: 20, fontWeight: "800" }} numberOfLines={1}>
                {pro.name || "PRO"}
              </Text>
            </View>
            <HeaderIconButton icon="notifications-outline" label="Notifications" onDark onPress={() => navigation.navigate("Notifications")} />
          </View>
          {pro.districtId ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: 4 }}>
              <Ionicons name="location" size={14} color={colors.brandOnDark} />
              <Text style={{ color: colors.brandOnDark, fontSize: 13, fontWeight: "600" }}>{pro.districtId} district</Text>
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: -56 }}>
          {/* ── Today's target ─────────────────────────────────── */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, ...shadow.floating }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={typography.overline}>TODAY'S TARGET</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6 }}>
                  <Text style={{ fontSize: 40, fontWeight: "800", color: colors.text, lineHeight: 44 }}>{dailyDone}</Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.muted, marginLeft: 4 }}>/ {dailyTarget}</Text>
                </View>
                <Text style={[typography.caption, { marginTop: 2 }]}>hospitals onboarded</Text>
              </View>
              <Pill
                tone={dailyDone >= dailyTarget ? "green" : "brand"}
                icon={dailyDone >= dailyTarget ? "trophy" : "flag"}
                label={dailyDone >= dailyTarget ? "TARGET MET" : `${Math.max(0, dailyTarget - dailyDone)} TO GO`}
              />
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <ProgressBar value={dailyDone / dailyTarget} tone={dailyDone >= dailyTarget ? "green" : "brand"} height={10} />
            </View>
            <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg }} />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={16} color={colors.muted} />
              <Text style={[typography.caption, { flex: 1, marginLeft: 6 }]}>Last 7 days</Text>
              <Text style={{ fontWeight: "800", color: colors.text, fontSize: 13 }}>
                {weeklyDone}
                <Text style={{ color: colors.muted, fontWeight: "600" }}> / {weeklyTarget}</Text>
              </Text>
            </View>
            <View style={{ marginTop: spacing.sm }}>
              <ProgressBar value={weeklyDone / weeklyTarget} tone="violet" height={6} />
            </View>
          </View>

          {error ? <ErrorBanner message={error} onRetry={() => { setLoading(true); load(); }} /> : null}

          {/* ── Next up ────────────────────────────────────────── */}
          <SectionHeader title="Next up" />
          {overdue.length > 0 ? (
            <NextCard
              tone="red"
              icon="alert-circle"
              title={`${overdue.length} hospital${overdue.length > 1 ? "s" : ""} passed the ${PRO_RULES.visitWindowHours}h visit window`}
              message="Review them in your bucket — release the ones you can't visit so other PROs can pick them."
              actionLabel="Review bucket"
              onAction={() => navigation.navigate("Bucket")}
            />
          ) : next ? (
            <NextHospitalCard hospital={next} now={now} onVisit={() => openVisit(next)} />
          ) : used >= bucketSize ? (
            <NextCard
              tone="amber"
              icon="hourglass-outline"
              title="Your bucket is full"
              message="Visit or release a hospital to free a slot."
              actionLabel="Open bucket"
              onAction={() => navigation.navigate("Bucket")}
            />
          ) : (
            <NextCard
              tone="brand"
              icon="search"
              title="Pick hospitals to visit"
              message={`Choose up to ${bucketSize - used} un-onboarded hospital${bucketSize - used > 1 ? "s" : ""}${pro.districtId ? ` in ${pro.districtId}` : ""}. You'll have ${PRO_RULES.visitWindowHours} hours to visit each one.`}
              actionLabel="Find hospitals"
              onAction={() => navigation.navigate("Hospitals")}
            />
          )}

          {/* ── Bucket ─────────────────────────────────────────── */}
          <SectionHeader
            title="My bucket"
            caption={`${used} of ${bucketSize} slots in use`}
            actionLabel={bucketHospitals.length ? "View all" : undefined}
            onAction={() => navigation.navigate("Bucket")}
          />
          <Card>
            <SlotMeter used={used} total={bucketSize} />
            {bucketHospitals.length === 0 ? (
              <EmptyState
                icon="briefcase-outline"
                title="Bucket is empty"
                message="Hospitals you pick show up here with their visit deadline."
                actionLabel="Find hospitals"
                onAction={() => navigation.navigate("Hospitals")}
              />
            ) : (
              <View style={{ marginTop: spacing.md }}>
                {bucketHospitals.slice(0, 3).map((h, i) => (
                  <BucketRow key={h.proHospitalId || i} hospital={h} now={now} last={i === Math.min(2, bucketHospitals.length - 1)} onPress={() => navigation.navigate("Bucket")} />
                ))}
                {bucketHospitals.length > 3 ? (
                  <Text style={[typography.caption, { textAlign: "center", marginTop: spacing.sm }]}>+{bucketHospitals.length - 3} more in your bucket</Text>
                ) : null}
              </View>
            )}
          </Card>

          {/* ── All-time ───────────────────────────────────────── */}
          <SectionHeader title="Your performance" caption="All time" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <StatTile icon="checkmark-done" tone="green" value={metrics.onboardedHospitals ?? 0} label="Onboarded" onPress={() => navigation.navigate("Onboarded")} />
            <StatTile icon="briefcase" tone="brand" value={metrics.activeBucketCount ?? used} label="In bucket" onPress={() => navigation.navigate("Bucket")} />
            <StatTile icon="close-circle" tone="red" value={metrics.rejectedHospitals ?? 0} label="Not interested" />
            <StatTile icon="time" tone="amber" value={(metrics.expiredHospitals ?? 0) + (metrics.releasedHospitals ?? 0)} label="Expired / released" />
          </View>

          {/* ── Shortcuts ──────────────────────────────────────── */}
          <SectionHeader title="Shortcuts" />
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Shortcut icon="search" label="Find" onPress={() => navigation.navigate("Hospitals")} />
            <Shortcut icon="briefcase" label="Bucket" onPress={() => navigation.navigate("Bucket")} />
            <Shortcut icon="ribbon" label="Onboarded" onPress={() => navigation.navigate("Onboarded")} />
            <Shortcut icon="gift" label="Rewards" onPress={() => navigation.navigate("Rewards")} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NextCard({ tone, icon, title, message, actionLabel, onAction }: { tone: Tone; icon: any; title: string; message: string; actionLabel: string; onAction: () => void }) {
  return (
    <Card>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <IconBadge icon={icon} tone={tone} />
        <View style={{ flex: 1 }}>
          <Text style={typography.heading}>{title}</Text>
          <Text style={[typography.body, { marginTop: 4 }]}>{message}</Text>
        </View>
      </View>
      <Button label={actionLabel} onPress={onAction} variant={tone === "red" ? "danger" : "primary"} icon="arrow-forward" style={{ marginTop: spacing.lg }} />
    </Card>
  );
}

function NextHospitalCard({ hospital, now, onVisit }: { hospital: any; now: number; onVisit: () => void }) {
  const { title, subtitle } = splitHospitalName(hospital.hospitalPool?.name || hospital.name, hospital.hospitalPool?.address);
  const t = timeLeft(hospital.blockExpiresAt, now);
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={typography.overline}>VISIT NEXT</Text>
        <Pill tone={urgencyTone(t.ms, t.expired)} icon="time-outline" label={t.label.toUpperCase()} />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
        <IconBadge icon="business" />
        <View style={{ flex: 1 }}>
          <Text style={typography.heading} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={[typography.caption, { marginTop: 3 }]} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
      </View>
      <Button label="Start visit" icon="navigate" onPress={onVisit} style={{ marginTop: spacing.lg }} />
    </Card>
  );
}

function BucketRow({ hospital, now, last, onPress }: { hospital: any; now: number; last: boolean; onPress: () => void }) {
  const { title } = splitHospitalName(hospital.hospitalPool?.name || hospital.name, hospital.hospitalPool?.address);
  const t = timeLeft(hospital.blockExpiresAt, now);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.divider, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneDot(urgencyTone(t.ms, t.expired)), marginRight: spacing.md }} />
      <Text style={[typography.label, { flex: 1 }]} numberOfLines={1}>{title}</Text>
      <Text style={[typography.caption, { marginLeft: spacing.sm, color: t.expired ? colors.red : colors.muted }]}>{t.expired ? "Window passed" : t.label}</Text>
    </Pressable>
  );
}

const toneDot = (tone: Tone) => ({ green: colors.green, amber: colors.amber, red: colors.red, brand: colors.brand, violet: colors.violet, neutral: colors.muted })[tone];

function StatTile({ icon, tone, value, label, onPress }: { icon: any; tone: Tone; value: number; label: string; onPress?: () => void }) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={{ flexBasis: "47%", flexGrow: 1, padding: spacing.lg }}>
      <IconBadge icon={icon} tone={tone} size={36} />
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, marginTop: spacing.md }}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </Card>
  );
}

function Shortcut({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 })}
    >
      <IconBadge icon={icon} size={38} />
      <Text style={[typography.caption, { marginTop: 6, color: colors.text, fontWeight: "700" }]}>{label}</Text>
    </Pressable>
  );
}
