import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Booking } from "../../../api/types";
import { C, Card, EmptyState, ErrorBanner, SectionTitle } from "../../../components/ui";
import { dateTime, patientName, rupees, serviceName } from "../../../utils/format";
import { useProviderBookings } from "../../bookings/useProviderBookings";
import { useHbcStore } from "../../provider-state/store";

// The API has no earnings endpoint; totals are the sum of completed booking amounts.
export default function Earnings({ navigation }: any) {
  const { profile } = useHbcStore();
  const { mine, loading, error, reload } = useProviderBookings(!!profile);

  const completed = mine
    .filter((b) => b.status === "COMPLETED")
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
  const sum = (list: Booking[]) => list.reduce((t, b) => t + (Number(b.amount) || 0), 0);

  const now = new Date();
  const sameDay = (iso?: string | null) => !!iso && new Date(iso).toDateString() === now.toDateString();
  const sameMonth = (iso?: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const today = completed.filter((b) => sameDay(b.completedAt));
  const month = completed.filter((b) => sameMonth(b.completedAt));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={C.blue} />} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text style={{ fontSize: 23, fontWeight: "900", color: C.ink }}>Earnings</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 4, marginBottom: 16 }}>From your completed visits</Text>
        <ErrorBanner message={error} onRetry={reload} />

        <Card>
          <Text style={{ color: C.muted, fontSize: 12 }}>This month</Text>
          <Text style={{ color: C.green, fontSize: 32, fontWeight: "900", marginTop: 4 }}>{rupees(sum(month))}</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{month.length} visit{month.length === 1 ? "" : "s"}</Text>
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />
          <Row label="Today" value={`${rupees(sum(today))} · ${today.length} visit${today.length === 1 ? "" : "s"}`} />
          <Row label="All time" value={`${rupees(sum(completed))} · ${completed.length} visit${completed.length === 1 ? "" : "s"}`} />
        </Card>

        <SectionTitle title="Completed visits" />
        {completed.map((b) => (
          <Pressable key={b.id} onPress={() => navigation.navigate("HomeCareBookingDetails", { bookingId: b.id, booking: b })} style={{ backgroundColor: C.card, borderRadius: 14, padding: 13, marginBottom: 9, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.ink, fontWeight: "800" }}>{patientName(b)}</Text>
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{serviceName(b)} · {dateTime(b.completedAt)}</Text>
            </View>
            <Text style={{ color: C.green, fontWeight: "900" }}>{rupees(b.amount)}</Text>
          </Pressable>
        ))}
        {!loading && !completed.length ? <EmptyState icon="wallet-outline" title="No completed visits yet" subtitle="Completed bookings and their amounts appear here." /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 }}>
      <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: C.ink, fontSize: 13, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
