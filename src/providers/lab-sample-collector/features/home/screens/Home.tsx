import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BookingCard from "../../bookings/components/BookingCard";
const BG = "#F5F8FC", BLUE = "#1473E6", GREEN = "#159447", MUTED = "#758096", TEXT = "#172033";
import { useLabSampleCollector } from "../../provider-state/store";

export default function Home({ navigation }: any) {
  const { requests, activeBooking } = useLabSampleCollector();
  const current = activeBooking;
  const open = requests.length;

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View><Text style={{ color: TEXT, fontSize: 23, fontWeight: "900" }}>Hi, Arun 👋</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Ready for sample collection today?</Text></View>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}><Ionicons name="notifications-outline" size={21} color={TEXT} /></View>
      </View>

      <View style={{ marginTop: 16, backgroundColor: "#fff", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E8ECF3" }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#E6F8EE", alignItems: "center", justifyContent: "center" }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN }} /></View>
        <View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: TEXT, fontSize: 12, fontWeight: "900" }}>{current ? "On a collection" : "You are Online"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{current ? "Finish the current job to receive another" : "You will receive new collection requests"}</Text></View>
        <View style={{ width: 45, height: 25, borderRadius: 14, backgroundColor: BLUE, padding: 3, justifyContent: "center" }}><View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: "#fff", alignSelf: "flex-end" }} /></View>
      </View>

      <View style={{ flexDirection: "row", gap: 9, marginTop: 12 }}>
        {[{ n: current ? "1" : "0", l: "Active" }, { n: "4", l: "Completed" }, { n: "₹1,250", l: "Earnings" }].map(x => <View key={x.l} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 13, borderWidth: 1, borderColor: "#E8ECF3" }}><Text style={{ color: BLUE, fontSize: 17, fontWeight: "900" }}>{x.n}</Text><Text style={{ color: MUTED, fontSize: 9.5, marginTop: 3 }}>{x.l}</Text></View>)}
      </View>

      {current ? <View style={{ marginTop: 18 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: "900", marginBottom: 10 }}>Current Collection</Text><BookingCard booking={current} onPress={() => navigation.navigate("LabCollectorBookingDetails", { bookingId: current.id })} /></View> : null}

      {!current ? <View style={{ marginTop: 18 }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>New Requests</Text><Text style={{ color: BLUE, fontSize: 11, fontWeight: "800" }}>{open} available</Text></View>{requests.slice(0, 3).map(b => <BookingCard key={b.id} booking={b} onPress={() => navigation.navigate("LabCollectorBookingDetails", { bookingId: b.id })} />)}{!requests.length ? <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 30, alignItems: "center" }}><Ionicons name="checkmark-circle-outline" size={40} color={GREEN} /><Text style={{ color: TEXT, fontWeight: "900", marginTop: 10 }}>No new requests</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>You are all caught up.</Text></View> : null}</View> : null}

      <Pressable onPress={() => Alert.alert("Collector rule", "Only one sample collection can be accepted at a time.")} style={{ marginTop: 6, alignItems: "center", padding: 10 }}><Text style={{ color: MUTED, fontSize: 10, fontWeight: "700" }}>• One active collection at a time •</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
