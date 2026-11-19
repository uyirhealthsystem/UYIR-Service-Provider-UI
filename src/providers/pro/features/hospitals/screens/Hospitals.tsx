import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBucket, pickHospital } from "../../../api/bucket";
import { getAvailableHospitals } from "../../../api/hospitals";
import { getMyProfile } from "../../../api/profile";
import { colors, PRO_RULES, radius, shadow, spacing, typography } from "../../../theme";
import { Button, EmptyState, ErrorBanner, HeaderIconButton, Pill, SlotMeter } from "../../../ui/components";
import { proIdFrom, splitHospitalName } from "../../../ui/format";

// Find hospitals: un-onboarded hospitals in the PRO's district
// (GET /hospitalpool/available/:proId) that aren't in anyone's bucket.
// Tap to select up to the free bucket slots, then add them in one go
// (POST /pro/hospital).

const MAX_SELECTION = PRO_RULES.bucketSize;

type PoolHospital = {
  hospitalPoolId: string;
  title: string;
  subtitle: string;
  districtId?: string;
  tnceraNo?: string;
  establishmentType?: string;
  search: string;
};

const extractList = (response: any): any[] =>
  Array.isArray(response?.data?.hospitals) ? response.data.hospitals
    : Array.isArray(response?.data) ? response.data
      : Array.isArray(response?.hospitals) ? response.hospitals
        : Array.isArray(response) ? response
          : [];

export default function Hospitals({ navigation }: any) {
  const hasLoadedHospitals = useRef(false);
  const proIdRef = useRef("");

  const [search, setSearch] = useState("");
  const [hospitals, setHospitals] = useState<PoolHospital[]>([]);
  const [selected, setSelected] = useState<PoolHospital[]>([]);
  const [bucketCount, setBucketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [district, setDistrict] = useState("");

  const getBucketCount = useCallback(async (proId: string) => {
    try {
      setBucketCount(extractList(await getBucket(proId)).length);
    } catch (bucketError: any) {
      console.log("PRO bucket API error:", bucketError);
      setBucketCount(0);
    }
  }, []);

  // `silent` refreshes keep the current list on screen (focus / pull-to-refresh).
  const loadHospitals = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setLoadError("");

        const profileResponse = await getMyProfile();
        const profile = profileResponse?.data || profileResponse || {};
        const proId = proIdFrom(profileResponse);
        if (!proId) throw new Error("Your PRO profile could not be found. Please log in again.");
        proIdRef.current = proId;
        if (profile?.districtId) setDistrict(profile.districtId);

        const rows = extractList(await getAvailableHospitals(proId));
        console.log("Available hospitals count:", rows.length);

        // Keep only what the list needs (the pool can hold thousands of rows).
        const list: PoolHospital[] = rows.map((h: any) => {
          const { title, subtitle } = splitHospitalName(h?.name, h?.address);
          return {
            hospitalPoolId: h?.hospitalPoolId,
            title,
            subtitle,
            districtId: h?.districtId,
            tnceraNo: h?.tnceraNo,
            establishmentType: h?.establishmentType,
            search: `${h?.name || ""} ${h?.address || ""} ${h?.tnceraNo || ""} ${h?.establishmentType || ""}`.toLowerCase(),
          };
        });
        setHospitals(list);
        if (!profile?.districtId && list[0]?.districtId) setDistrict(list[0].districtId);
        // Drop selections that are no longer available (picked by someone else).
        setSelected((current) => current.filter((s) => list.some((h) => h.hospitalPoolId === s.hospitalPoolId)));
        hasLoadedHospitals.current = true;

        await getBucketCount(proId);
      } catch (e: any) {
        console.log("Hospitals screen API error:", e);
        // A failed background refresh keeps the list on screen.
        if (!(silent && hasLoadedHospitals.current)) setLoadError(e?.message || "Unable to load hospitals");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getBucketCount],
  );

  // Reload whenever the screen gains focus so newly imported / released
  // hospitals appear without restarting the app.
  useFocusEffect(
    useCallback(() => {
      loadHospitals({ silent: hasLoadedHospitals.current });
    }, [loadHospitals]),
  );

  const freeSlots = Math.max(0, MAX_SELECTION - bucketCount);
  const canSelectMore = selected.length < freeSlots;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? hospitals.filter((h) => h.search.includes(q)) : hospitals;
  }, [hospitals, search]);

  const isSelected = (h: PoolHospital) => selected.some((s) => s.hospitalPoolId === h.hospitalPoolId);

  const toggle = (h: PoolHospital) => {
    setError("");
    if (isSelected(h)) {
      setSelected((cur) => cur.filter((s) => s.hospitalPoolId !== h.hospitalPoolId));
      return;
    }
    if (freeSlots === 0) {
      setError("Your bucket is full. Visit or release a hospital first.");
      return;
    }
    if (!canSelectMore) {
      setError(`You can add ${freeSlots} more hospital${freeSlots > 1 ? "s" : ""} right now.`);
      return;
    }
    setSelected((cur) => [...cur, h]);
  };

  const addToBucket = async () => {
    if (selected.length === 0 || saving) return;
    try {
      setSaving(true);
      setError("");
      const proId = proIdRef.current;
      if (!proId) throw new Error("Your PRO profile could not be found. Please log in again.");
      await pickHospital({ proId, hospitals: selected.map((h) => ({ hospitalPoolId: h.hospitalPoolId })) });
      setSelected([]);
      navigation.navigate("Bucket");
    } catch (e: any) {
      console.log("Pick hospital error:", e);
      setError(e?.message || "Unable to add hospitals to your bucket.");
      // Someone may have picked one of them meanwhile; refresh the list.
      loadHospitals({ silent: true });
    } finally {
      setSaving(false);
    }
  };

  const renderHospital = ({ item }: { item: PoolHospital }) => {
    const on = isSelected(item);
    const dim = !on && !canSelectMore;
    return (
      <Pressable
        onPress={() => toggle(item)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on, disabled: dim }}
        accessibilityLabel={item.title}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "flex-start",
          backgroundColor: on ? "#F5F8FF" : colors.surface,
          borderRadius: radius.lg,
          borderWidth: on ? 1.5 : 1,
          borderColor: on ? colors.brand : colors.border,
          padding: spacing.lg,
          marginBottom: spacing.md,
          opacity: dim ? 0.55 : pressed ? 0.85 : 1,
          ...shadow.card,
        })}
      >
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="business" size={20} color={colors.brand} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md, minWidth: 0 }}>
          <Text style={[typography.label, { fontSize: 15 }]} numberOfLines={2}>{item.title}</Text>
          {item.subtitle ? <Text style={[typography.caption, { marginTop: 3, lineHeight: 17 }]} numberOfLines={2}>{item.subtitle}</Text> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm }}>
            {item.establishmentType ? <Pill label={item.establishmentType} tone="violet" /> : null}
            {item.tnceraNo ? <Pill label={item.tnceraNo} icon="document-text-outline" /> : null}
          </View>
        </View>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            marginLeft: spacing.sm,
            borderWidth: 2,
            borderColor: on ? colors.brand : colors.border,
            backgroundColor: on ? colors.brand : colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {on ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
        </View>
      </Pressable>
    );
  };

  const header = (
    <View style={{ paddingTop: spacing.lg }}>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
          <Text style={[typography.label, { flex: 1 }]}>
            {freeSlots === 0 ? "Bucket full" : `${freeSlots - selected.length} of ${freeSlots} free slot${freeSlots > 1 ? "s" : ""} left`}
          </Text>
          <Text style={typography.caption}>{bucketCount + selected.length}/{MAX_SELECTION}</Text>
        </View>
        <SlotMeter used={bucketCount + selected.length} total={MAX_SELECTION} />
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>
          {freeSlots === 0
            ? "Visit or release a hospital in your bucket to pick more."
            : `Picked hospitals are reserved for you — visit each within ${PRO_RULES.visitWindowHours} hours.`}
        </Text>
      </View>
      <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        {filtered.length} {search.trim() ? "MATCHING" : "AVAILABLE"} HOSPITAL{filtered.length === 1 ? "" : "S"}
      </Text>
      {error ? <View style={{ marginBottom: spacing.md, marginTop: -spacing.md }}><ErrorBanner message={error} /></View> : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header + search */}
      <View style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={typography.title}>Find hospitals</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 }}>
              <Ionicons name="location" size={13} color={colors.brand} />
              <Text style={[typography.caption, { color: colors.brand, fontWeight: "700" }]}>{district || "Your district"}</Text>
            </View>
          </View>
          <HeaderIconButton icon="briefcase-outline" label="Open my bucket" badge={bucketCount} onPress={() => navigation.navigate("Bucket")} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46 }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, town or TNCERA no."
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            returnKeyType="search"
            style={{ flex: 1, marginLeft: spacing.sm, fontSize: 14, color: colors.text }}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[typography.caption, { marginTop: spacing.md }]}>Loading hospitals…</Text>
        </View>
      ) : loadError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load hospitals"
          message={loadError}
          actionLabel="Try again"
          onAction={() => { hasLoadedHospitals.current = false; loadHospitals(); }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => String(item.hospitalPoolId || index)}
          renderItem={renderHospital}
          extraData={selected}
          ListHeaderComponent={header}
          initialNumToRender={12}
          windowSize={7}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHospitals({ silent: true })} colors={[colors.brand]} tintColor={colors.brand} />}
          ListEmptyComponent={
            search.trim() ? (
              <EmptyState icon="search-outline" title="No matches" message={`Nothing matches "${search.trim()}". Try a shorter name or the town.`} actionLabel="Clear search" onAction={() => setSearch("")} />
            ) : (
              <EmptyState icon="business-outline" title="No hospitals available" message={`There are no un-onboarded hospitals${district ? ` in ${district}` : ""} right now. Pull down to refresh.`} />
            )
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl + (selected.length ? 96 : 0) }}
        />
      )}

      {/* Selection bar */}
      {selected.length > 0 ? (
        <View
          style={{
            position: "absolute",
            left: spacing.lg,
            right: spacing.lg,
            bottom: spacing.md,
            backgroundColor: colors.text,
            borderRadius: radius.xl,
            padding: spacing.md,
            paddingLeft: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            ...shadow.floating,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.white, fontWeight: "800", fontSize: 15 }}>{selected.length} selected</Text>
            <Pressable onPress={() => setSelected([])} hitSlop={8}>
              <Text style={{ color: "#AEB9CF", fontSize: 12, marginTop: 2 }}>Clear selection</Text>
            </Pressable>
          </View>
          <Button label="Add to bucket" icon="add-circle" onPress={addToBucket} loading={saving} compact style={{ paddingHorizontal: spacing.lg }} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
