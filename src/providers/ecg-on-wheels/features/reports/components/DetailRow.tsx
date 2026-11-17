import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function DetailRow({ icon, title, value }: { icon: any; title: string; value: string }) {
  return <View style={{ marginTop: 13, flexDirection: "row", alignItems: "flex-start" }}><Ionicons name={icon} size={18} color="#1473E6" /><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: "#6F7B8C", fontSize: 9 }}>{title}</Text><Text style={{ color: "#10233F", fontSize: 11, fontWeight: "700", marginTop: 2 }}>{value}</Text></View></View>;
}
