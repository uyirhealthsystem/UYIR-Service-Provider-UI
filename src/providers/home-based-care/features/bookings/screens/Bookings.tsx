import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACTIVE_STATUSES, type Booking } from "../../../api/types";
import { BookingCard, Button, C, EmptyState, ErrorBanner } from "../../../components/ui";
import { useHbcStore } from "../../provider-state/store";
import { LocationRequired } from "../components/LocationRequired";
import { useProviderBookings } from "../useProviderBookings";

type Tab = "POOL" | "ACTIVE" | "COMPLETED" | "CANCELLED";
const TABS: { key: Tab; label: string }[] = [
  { key: "POOL", label: "Open pool" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function Bookings({ navigation, route }: any) {
  const { profile } = useHbcStore();
  const { pool, mine, loading, error, poolBlock, reload, accept, acceptingId } = useProviderBookings(!!profile);
  const [tab, setTab] = useState<Tab>("POOL");

  useEffect(() => {
    const requested = route?.params?.tab as Tab | undefined;
    if (requested) {
      setTab(requested);
      navigation.setParams({ tab: undefined });
    }
  }, [route?.params?.tab]);

  const list: Booking[] =
    tab === "POOL" ? pool
    : tab === "ACTIVE" ? mine.filter((b) => ACTIVE_STATUSES.includes(b.status))
    : mine.filter((b) => b.status === tab);

  const count = (t: Tab) => (t === "POOL" ? pool.length : t === "ACTIVE" ? mine.filter((b) => ACTIVE_STATUSES.includes(b.status)).length : mine.filter((b) => b.status === t).length);

  const open = (b: Booking) => navigation.navigate("HomeCareBookingDetails", { bookingId: b.id, booking: b });
  const onAccept = async (b: Booking) => {
    const accepted = await accept(b);
    if (accepted) open(accepted);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, backgroundColor: C.card, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
        <Text style={{ fontSize: 23, fontWeight: "900", color: C.ink }}>Bookings</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Pick open requests nearby and manage your visits.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ gap: 7 }}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: on ? C.blue : "#F0F4FA", flexDirection: "row" }}>
                <Text style={{ color: on ? "#FFFFFF" : C.muted, fontSize: 12, fontWeight: "800" }}>{t.label}</Text>
                <Text style={{ color: on ? "#DCEBFF" : "#9AA8BB", fontSize: 12, fontWeight: "800", marginLeft: 5 }}>{count(t.key)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={C.blue} />} contentContainerStyle={{ padding: 15, paddingBottom: 30 }}>
        <ErrorBanner message={error} onRetry={reload} />
        {tab === "POOL" && poolBlock ? (
          <LocationRequired code={poolBlock} onFix={() => navigation.navigate("HomeCareEditProfile")} />
        ) : (
          <>
            {tab === "POOL" && pool.length ? (
              <Text style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>Nearest first. Patient contact and address are shown after you accept.</Text>
            ) : null}
            {list.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onPress={() => open(b)}
                action={tab === "POOL" ? <Button title="Accept booking" onPress={() => onAccept(b)} busy={acceptingId === b.id} disabled={!!acceptingId} /> : undefined}
              />
            ))}
            {!loading && !list.length ? (
              <EmptyState
                title={tab === "POOL" ? "No open bookings nearby" : `No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} bookings`}
                subtitle="Pull down to refresh this list."
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
