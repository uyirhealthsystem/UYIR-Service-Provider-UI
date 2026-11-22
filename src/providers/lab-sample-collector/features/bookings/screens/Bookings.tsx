import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import BookingCard from "../components/BookingCard";
const BG = "#F5F8FC", MUTED = "#758096", TEXT = "#172033";
import { useLabSampleCollector } from "../../provider-state/store";

export default function Bookings({ navigation }: any) {
  const { requests, activeBooking, history } = useLabSampleCollector();
  const all = [...(activeBooking ? [activeBooking] : []), ...history, ...requests];
  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => navigation.navigate("Home")} style={{ width: 36, height: 36, justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={24} color={TEXT} />
        </Pressable>
        <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900", flex: 1, marginRight: 36, textAlign: "center" }}>Bookings</Text>
      </View>
      <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Your collection requests and completed jobs</Text>
      <View style={{ marginTop: 16 }}>{all.map(b => <BookingCard key={b.id} booking={b} onPress={() => navigation.navigate("LabCollectorBookingDetails", { bookingId: b.id })} />)}{!all.length ? <Text style={{ color: MUTED, textAlign: "center", marginTop: 40 }}>No bookings yet.</Text> : null}</View>
    </ScrollView>
  </SafeAreaView>;
}
