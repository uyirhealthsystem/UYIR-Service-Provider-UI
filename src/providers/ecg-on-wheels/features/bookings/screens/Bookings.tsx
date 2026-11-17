import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useECG } from "../../provider-state/store";

import StatusPill from "../components/StatusPill";

const BG = "#F5F8FC";
const BLUE = "#1473E6";
const MUTED = "#6B7890";
const TEXT = "#10233F";

export default function Bookings({ navigation }: any) {
  const { requests, activeBooking, completedBookings, refresh, loading } = useECG();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} refreshing={loading} onRefresh={refresh}>
      <Text style={{ color: TEXT, fontSize: 24, fontWeight: "900" }}>Bookings</Text>
      <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>Only one booking can be active at a time.</Text>
      {activeBooking ? <Card booking={activeBooking} active onPress={() => navigation.navigate("ECGBookingDetails", { bookingId: activeBooking.id })} /> : requests[0] ? <Card booking={requests[0]} onPress={() => navigation.navigate("ECGBookingDetails", { bookingId: requests[0].id })} /> : null}
      {completedBookings.map((booking) => <Card key={booking.id} booking={booking} completed onPress={() => navigation.navigate("ECGBookingDetails", { bookingId: booking.id })} />)}
      {!activeBooking && !requests[0] && completedBookings.length === 0 ? <View style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 30, alignItems: "center" }}><Ionicons name="calendar-outline" size={40} color={BLUE} /><Text style={{ color: TEXT, fontWeight: "900", marginTop: 10 }}>No bookings</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>New ECG requests will appear here.</Text></View> : null}
    </ScrollView>
  </SafeAreaView>;
}

function Card({ booking, onPress, active, completed }: any) {
  return <Pressable onPress={onPress} style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 15 }}>
    <View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 43, height: 43, borderRadius: 22, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={21} color={BLUE} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: TEXT, fontWeight: "900", fontSize: 14 }}>{booking.patient}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{booking.date || ""} {booking.time ? `• ${booking.time}` : ""}</Text></View><StatusPill label={completed ? "COMPLETED" : active ? booking.status.replaceAll("_", " ") : "NEW"} color={completed ? "#17B26A" : active ? "#17B26A" : BLUE} /></View>
    <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}><Ionicons name="location-outline" size={16} color={BLUE} /><Text style={{ flex: 1, marginLeft: 7, color: MUTED, fontSize: 10.5 }}>{booking.address || "Patient location"}</Text></View>
    <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}><Text style={{ flex: 1, color: TEXT, fontSize: 11, fontWeight: "700" }}>ECG at Home</Text><Text style={{ color: BLUE, fontSize: 13, fontWeight: "900" }}>{booking.amount ? `₹${booking.amount}` : "Amount pending"}</Text></View>
  </Pressable>;
}
