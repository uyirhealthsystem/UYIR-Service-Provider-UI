import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBucket, releaseHospital } from "../../../api/bucket";
import { getMyProfile } from "../../../api/profile";
import { colors, PRO_RULES, radius, spacing, typography } from "../../../theme";
import { Button, Card, EmptyState, ErrorBanner, HeaderIconButton, IconBadge, Pill, ProgressBar, SlotMeter } from "../../../ui/components";
import { proIdFrom, splitHospitalName, statusInfo, timeLeft, urgencyTone } from "../../../ui/format";

// My bucket: hospitals this PRO has reserved (GET /pro/:proId/bucket, status
// PICKED / NO_TIME). Each pick has a 24h visit window (blockExpiresAt).
// Start a visit inside the window; release (PICKED only) to hand it back.

const WINDOW_MS = PRO_RULES.visitWindowHours * 3_600_000;

export default function Bucket({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const proIdRef = useRef("");
  const loaded = useRef(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      setError("");
      const proId = proIdFrom(await getMyProfile());
      if (!proId) throw new Error("Your PRO profile could not be found. Please log in again.");
      proIdRef.current = proId;
      const response = await getBucket(proId);
      const rows = Array.isArray(response?.data?.hospitals) ? response.data.hospitals
        : Array.isArray(response?.data) ? response.data
          : Array.isArray(response?.hospitals) ? response.hospitals : [];
      setItems(rows);
      loaded.current = true;
    } catch (e: any) {
      console.log("Bucket API error:", e);
      setError(e?.message || "Unable to load your bucket.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(loaded.current);
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const release = (h: any) => {
    const { title } = splitHospitalName(h.hospitalPool?.name || h.name, h.hospitalPool?.address);
    Alert.alert(
      "Release hospital?",
      `${title} goes back to the pool so another PRO can pick it. This frees one slot in your bucket.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Release",
          style: "destructive",
          onPress: async () => {
            try {
              setReleasing(h.proHospitalId);
              setError("");
              await releaseHospital(proIdRef.current, h.proHospitalId);
              await load(true);
            } catch (e: any) {
              setError(e?.message || "Unable to release this hospital.");
            } finally {
              setReleasing(null);
            }
          },
        },
      ],
    );
  };

  const openVisit = (h: any) =>
    navigation.getParent()?.navigate("HospitalVisit", {
      hospitalId: h.hospitalId || h.hospitalPoolId,
      hospitalPoolId: h.hospitalPoolId,
      proHospitalId: h.proHospitalId,
    });

  const sorted = [...items].sort((a, b) => new Date(a.blockExpiresAt).getTime() - new Date(b.blockExpiresAt).getTime());
  const active = sorted.filter((h) => !timeLeft(h.blockExpiresAt, now).expired);
  const overdue = sorted.filter((h) => timeLeft(h.blockExpiresAt, now).expired);
  const free = Math.max(0, PRO_RULES.bucketSize - items.length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={typography.title}>My bucket</Text>
            <Text style={[typography.caption, { marginTop: 2 }]}>
              {items.length} of {PRO_RULES.bucketSize} slots in use{free ? ` · ${free} free` : ""}
            </Text>
          </View>
          <HeaderIconButton icon="add" label="Find more hospitals" onPress={() => navigation.navigate("Hospitals")} />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <SlotMeter used={items.length} total={PRO_RULES.bucketSize} />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.brand]} tintColor={colors.brand} />}
        >
          {error ? <ErrorBanner message={error} onRetry={() => load(true)} /> : null}

          {items.length === 0 && !error ? (
            <Card style={{ marginTop: spacing.md }}>
              <EmptyState
                icon="briefcase-outline"
                title="Your bucket is empty"
                message={`Pick up to ${PRO_RULES.bucketSize} hospitals. Each one is reserved for you for ${PRO_RULES.visitWindowHours} hours so you can visit it.`}
                actionLabel="Find hospitals"
                onAction={() => navigation.navigate("Hospitals")}
              />
            </Card>
          ) : null}

          {active.length ? (
            <>
              <Text style={[typography.overline, { marginTop: spacing.md, marginBottom: spacing.sm }]}>READY TO VISIT · {active.length}</Text>
              {active.map((h) => (
                <BucketCard key={h.proHospitalId} hospital={h} now={now} releasing={releasing === h.proHospitalId} onVisit={() => openVisit(h)} onRelease={() => release(h)} />
              ))}
            </>
          ) : null}

          {overdue.length ? (
            <>
              <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm, color: colors.red }]}>VISIT WINDOW PASSED · {overdue.length}</Text>
              <Text style={[typography.caption, { marginBottom: spacing.md }]}>
                These were not visited within {PRO_RULES.visitWindowHours} hours. Release them so other PROs can pick them; unreleased picks expire after {PRO_RULES.pickExpiryDays} days.
              </Text>
              {overdue.map((h) => (
                <BucketCard key={h.proHospitalId} hospital={h} now={now} releasing={releasing === h.proHospitalId} onRelease={() => release(h)} overdue />
              ))}
            </>
          ) : null}

          {items.length > 0 ? (
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.brandSoft, borderRadius: radius.md }}>
              <Ionicons name="information-circle" size={18} color={colors.brand} />
              <Text style={[typography.caption, { flex: 1, color: colors.textSecondary, lineHeight: 17 }]}>
                A visit needs two on-site photos (hospital exterior and you at the hospital), then the hospital's response.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BucketCard({
  hospital,
  now,
  releasing,
  onVisit,
  onRelease,
  overdue,
}: {
  hospital: any;
  now: number;
  releasing: boolean;
  onVisit?: () => void;
  onRelease: () => void;
  overdue?: boolean;
}) {
  const { title, subtitle } = splitHospitalName(hospital.hospitalPool?.name || hospital.name, hospital.hospitalPool?.address);
  const t = timeLeft(hospital.blockExpiresAt, now);
  const tone = urgencyTone(t.ms, t.expired);
  const status = statusInfo(hospital.status);
  const canRelease = String(hospital.status).toUpperCase() === "PICKED";

  return (
    <Card style={{ marginBottom: spacing.md, borderColor: overdue ? "#F6C9C5" : colors.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pill label={status.label.toUpperCase()} tone={status.tone} />
        <Pill label={t.expired ? "WINDOW PASSED" : t.label.toUpperCase()} tone={tone} icon={t.expired ? "alert-circle" : "time-outline"} />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
        <IconBadge icon="business" tone={overdue ? "red" : "brand"} />
        <View style={{ flex: 1 }}>
          <Text style={typography.heading} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={[typography.caption, { marginTop: 3, lineHeight: 17 }]} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
      </View>

      {!t.expired && !t.unknown ? (
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar value={t.ms / WINDOW_MS} tone={tone} height={6} />
          <Text style={[typography.caption, { marginTop: 6 }]}>
            Visit by {new Date(hospital.blockExpiresAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
        {onVisit ? <Button label="Start visit" icon="navigate" onPress={onVisit} style={{ flex: 1 }} /> : null}
        {canRelease ? (
          <Button
            label="Release"
            icon="return-up-back"
            variant={onVisit ? "ghost" : "danger"}
            onPress={onRelease}
            loading={releasing}
            style={onVisit ? { paddingHorizontal: spacing.lg } : { flex: 1 }}
          />
        ) : null}
      </View>
    </Card>
  );
}
