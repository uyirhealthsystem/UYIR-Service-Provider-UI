import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Stat({ value, label, icon }: { value: string; label: string; icon: any }) {
  return <View style={{ flex: 1, alignItems: "center" }}><Ionicons name={icon} size={18} color="#1473E6" /><Text style={{ color: "#1473E6", fontSize: 15, fontWeight: "900", marginTop: 4 }}>{value}</Text><Text style={{ color: "#6F7B8C", fontSize: 8, textAlign: "center", marginTop: 2 }}>{label}</Text></View>;
}
