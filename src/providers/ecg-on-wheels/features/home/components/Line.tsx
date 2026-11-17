import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Line({ icon, text }: { icon: any; text: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name={icon} size={16} color="#1473E6" /><Text style={{ marginLeft: 8, flex: 1, color: "#10233F", fontSize: 11 }}>{text}</Text></View>;
}
