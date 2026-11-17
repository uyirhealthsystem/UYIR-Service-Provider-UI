import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function EmptyState() {
  return <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 30, alignItems: "center" }}><Ionicons name="checkmark-done-circle-outline" size={44} color="#17B26A" /><Text style={{ color: "#10233F", fontSize: 15, fontWeight: "900", marginTop: 10 }}>No new requests</Text><Text style={{ color: "#6F7B8C", fontSize: 11, marginTop: 4, textAlign: "center" }}>Stay online. A new ECG booking will appear here.</Text></View>;
}
