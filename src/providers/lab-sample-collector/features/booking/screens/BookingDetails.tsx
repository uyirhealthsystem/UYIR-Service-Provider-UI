import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BG, BLUE, DetailRow, GREEN, Header, MUTED, PrimaryButton, RED, StatusPill, TEXT } from "../components/BookingUI";
import { useLabSampleCollector } from "../../provider-state/store";

export default function BookingDetails({ route, navigation }: any) {
  const { requests, activeBooking, acceptBooking, rejectBooking, setStatus } = useLabSampleCollector();
  const booking = activeBooking || requests.find(b => b.id === route.params?.bookingId) || requests[0];
  if (!booking) return null;

  const accept = () => {
    const result = acceptBooking(booking.id);
    if (!result) return Alert.alert("Booking unavailable", "Complete your current collection before accepting another request.");
    navigation.replace("LabCollectorBookingDetails", { bookingId: booking.id });
  };
  const reject = () => { rejectBooking(booking.id); Alert.alert("Request Rejected", "The collection request has been rejected.", [{ text: "OK", onPress: () => navigation.goBack() }]); };
  const goToPatient = () => { setStatus("REACHED"); navigation.navigate("LabCollectorBookingDetails", { bookingId: booking.id }); };

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}><Header title="Booking Details" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 55, height: 55, borderRadius: 28, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={27} color={BLUE} /></View><View style={{ flex: 1, marginLeft: 12 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>{booking.patient}</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{booking.gender} • {booking.age} yrs • {booking.phone}</Text></View><StatusPill status={booking.status} /></View>
        <DetailRow icon="calendar-outline" title="Collection Time" value={`${booking.date}, ${booking.time}`} />
        <DetailRow icon="location-outline" title="Patient Home" value={booking.address} />
        <DetailRow icon="flask-outline" title="Tests / Samples" value={booking.tests.map(t => t.name).join("\n")} />
        <DetailRow icon="navigate-outline" title="Distance" value={`${booking.distance} from your current area`} />
        <DetailRow icon="cash-outline" title="Collector Fee" value={`₹${booking.amount} • credited after lab confirmation`} />
        <View style={{ marginTop: 8, backgroundColor: "#F7F9FD", borderRadius: 12, padding: 13 }}><Text style={{ color: TEXT, fontSize: 11, fontWeight: "900" }}>Collection Note</Text><Text style={{ color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 5 }}>{booking.notes}</Text></View>
      </View>

      {booking.status === "NEW" ? <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}><Pressable onPress={reject} style={{ flex: 1, height: 50, borderRadius: 13, borderWidth: 1, borderColor: RED, alignItems: "center", justifyContent: "center" }}><Text style={{ color: RED, fontWeight: "900" }}>Reject</Text></Pressable><View style={{ flex: 1 }}><PrimaryButton title="Accept Booking" onPress={accept} /></View></View> : null}
      {booking.status === "ACCEPTED" ? <View style={{ marginTop: 14, backgroundColor: "#fff", borderRadius: 17, padding: 16 }}><View style={{ backgroundColor: "#EAF3FF", borderRadius: 12, padding: 13, flexDirection: "row" }}><Ionicons name="navigate-outline" size={19} color={BLUE} /><Text style={{ flex: 1, marginLeft: 8, color: BLUE, fontWeight: "800", fontSize: 11 }}>Go to the patient's home. Once you arrive, ask the patient for the OTP.</Text></View><View style={{ marginTop: 13 }}><PrimaryButton title="I've Reached the Patient" icon="location" onPress={goToPatient} /></View></View> : null}
      {booking.status === "REACHED" ? <View style={{ marginTop: 14, backgroundColor: "#fff", borderRadius: 17, padding: 16 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Verify Patient OTP</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 5 }}>Ask the patient for the 6-digit OTP to start sample collection.</Text><Pressable onPress={() => navigation.navigate("LabCollectorCollection", { bookingId: booking.id })} style={{ marginTop: 14, backgroundColor: "#EAF3FF", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center" }}><Ionicons name="lock-open-outline" size={20} color={BLUE} /><Text style={{ color: BLUE, fontWeight: "900", marginLeft: 9 }}>Enter OTP & Continue</Text><Ionicons name="chevron-forward" size={18} color={BLUE} style={{ marginLeft: "auto" }} /></Pressable></View> : null}
      {booking.status === "COLLECTED" || booking.status === "DELIVERING" ? <View style={{ marginTop: 14 }}><PrimaryButton title="Continue to Lab Delivery" onPress={() => navigation.navigate("LabCollectorDelivery", { bookingId: booking.id })} /></View> : null}
      {booking.status === "DELIVERED" ? <View style={{ marginTop: 14, backgroundColor: "#E6F8EE", borderRadius: 14, padding: 15 }}><Text style={{ color: GREEN, fontWeight: "900" }}>Waiting for lab confirmation</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>The lab must confirm that the samples were received.</Text></View> : null}
    </ScrollView>
  </SafeAreaView>;
}
