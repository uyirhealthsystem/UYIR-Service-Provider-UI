import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function EmptyBookings() {
  return <View style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 30, alignItems: "center" }}><Ionicons name="calendar-outline" size={40} color="#1473E6" /><Text style={{ color: "#10233F", fontWeight: "900", marginTop: 10 }}>No bookings</Text><Text style={{ color: "#6F7B8C", fontSize: 11, marginTop: 4 }}>New ECG requests will appear here.</Text></View>;
}
