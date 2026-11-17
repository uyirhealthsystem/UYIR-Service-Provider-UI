import { Ionicons } from "@expo/vector-icons";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACTIVE_STATUSES, type Booking } from "../../../api/types";
import { BookingCard, Button, C, EmptyState, ErrorBanner, SectionTitle } from "../../../components/ui";
import { CARE_TYPE_ICON, careTypeLabel, rupees } from "../../../utils/format";
import { useProviderBookings } from "../../bookings/useProviderBookings";
import { useHbcStore } from "../../provider-state/store";
import { LocationRequired } from "../../bookings/components/LocationRequired";

export default function Home({ navigation }: any) {
  const { profile, error: profileError, refresh: refreshProfile } = useHbcStore();
  const { pool, mine, loading, error, poolBlock, reload, accept, acceptingId } = useProviderBookings(!!profile);

  const active = mine.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const completed = mine.filter((b) => b.status === "COMPLETED");
  const earned = completed.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const nextAction = active.find((b) => b.status === "PAID" || b.status === "IN_PROGRESS") || active[0];

  const open = (b: Booking) => navigation.navigate("HomeCareBookingDetails", { bookingId: b.id, booking: b });
  const onAccept = async (b: Booking) => {
    const accepted = await accept(b);
    if (accepted) open(accepted);
  };

  const firstName = (profile?.fullName || "there").split(" ")[0];
  const careType = profile?.careType || "NURSE";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { refreshProfile(); reload(); }} tintColor={C.blue} />}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View style={{ backgroundColor: C.blue, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 45, height: 45, borderRadius: 15, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={CARE_TYPE_ICON[careType] as any} size={22} color={C.blue} />
            </View>
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Text style={{ color: "#DCEBFF", fontSize: 11, fontWeight: "700" }}>{careTypeLabel(careType).toUpperCase()}</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 2 }}>Hello, {firstName}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 20 }}>
            <Stat value={String(pool.length)} label="Open nearby" />
            <Stat value={String(active.length)} label="Active" />
            <Stat value={rupees(earned)} label="Earned" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <ErrorBanner message={profileError || error} onRetry={() => { refreshProfile(); reload(); }} />

          {nextAction ? (
            <>
              <SectionTitle title="Up next" action="All active" onAction={() => navigation.navigate("Bookings", { tab: "ACTIVE" })} />
              <BookingCard booking={nextAction} onPress={() => open(nextAction)} />
            </>
          ) : null}

          <SectionTitle title="New in your pool" action="View all" onAction={() => navigation.navigate("Bookings", { tab: "POOL" })} />
          {poolBlock ? (
            <LocationRequired code={poolBlock} onFix={() => navigation.navigate("HomeCareEditProfile")} />
          ) : pool.length ? (
            pool.slice(0, 3).map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onPress={() => open(b)}
                action={<Button title="Accept booking" onPress={() => onAccept(b)} busy={acceptingId === b.id} disabled={!!acceptingId} />}
              />
            ))
          ) : !loading ? (
            <EmptyState icon="calendar-clear-outline" title="No open bookings nearby" subtitle="Pull down to refresh. New requests in your area appear here." />
          ) : null}

          <Pressable
            onPress={() => navigation.navigate("HomeCareServices")}
            style={{ marginTop: 18, backgroundColor: C.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border }}
          >
            <Ionicons name="pricetags-outline" size={20} color={C.blue} />
            <Text style={{ flex: 1, marginLeft: 10, color: C.ink, fontWeight: "800" }}>{careTypeLabel(careType)} services & rates</Text>
            <Ionicons name="chevron-forward" size={18} color="#9AA8BB" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF22", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10 }}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: "#FFFFFF", fontSize: 19, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: "#DCEBFF", fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
