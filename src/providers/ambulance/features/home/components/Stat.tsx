import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Stat({ value, label, icon }: any) {
  const BLUE = "#1473E6";
  const MUTED = "#6B7890";

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Ionicons name={icon} size={18} color={BLUE} />
      <Text style={{ color: BLUE, fontSize: 15, fontWeight: "900", marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ color: MUTED, fontSize: 8, textAlign: "center", marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}
