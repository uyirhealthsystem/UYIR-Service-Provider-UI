import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Row({ icon, label, value }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
      <Ionicons name={icon} size={19} color="#17B26A" />
      <Text style={{ flex: 1, marginLeft: 10, color: "#6B7890", fontSize: 11 }}>{label}</Text>
      <Text style={{ color: "#10233F", fontWeight: "900", fontSize: 13 }}>{value}</Text>
    </View>
  );
}
