import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function SummaryRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9 }}><Ionicons name={icon} size={18} color="#1473E6" /><Text style={{ flex: 1, marginLeft: 10, color: "#6F7B8C", fontSize: 11 }}>{label}</Text><Text style={{ color: "#10233F", fontSize: 11, fontWeight: "800" }}>{value}</Text></View>;
}
