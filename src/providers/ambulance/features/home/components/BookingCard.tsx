import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import StatusPill from "../../bookings/components/StatusPill";
import Line from "./Line";

export default function BookingCard({ booking, onPress, active }: any) {
  const BLUE = "#1473E6";
  const GREEN = "#17B26A";
  const TEXT = "#10233F";
  const MUTED = "#6B7890";

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        padding: 15,
        borderWidth: active ? 0 : 1,
        borderColor: "#D9E9FF",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#EAF3FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="person" size={24} color={BLUE} />
        </View>
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>
            {booking.patient}
          </Text>
          <Text style={{ color: MUTED, fontSize: 10.5, marginTop: 3 }}>
            {booking.gender} • {booking.age} yrs
          </Text>
        </View>
        <StatusPill label={active ? "ACCEPTED" : "NEW"} color={active ? GREEN : BLUE} />
      </View>

      <View style={{ marginTop: 14, gap: 8 }}>
        <Line icon="time-outline" text={`${booking.date} • ${booking.time}`} />
        <Line icon="location-outline" text={`${booking.patientAddress} • ${booking.pickupDistance}`} />
        <Line
          icon="medical-outline"
          text={booking.serviceType === "AMBULANCE" ? "Ambulance Transport" : "Auto Patient Transport"}
        />
      </View>

      <View
        style={{
          marginTop: 13,
          height: 44,
          backgroundColor: active ? "#EAF3FF" : BLUE,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: active ? BLUE : "#FFFFFF", fontWeight: "900" }}>
          {active ? "Continue Trip" : "View Booking Request"}
        </Text>
      </View>
    </Pressable>
  );
}
