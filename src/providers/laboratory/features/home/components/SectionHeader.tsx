import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function SectionHeader({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#172033" }}>{title}</Text>
      <Pressable onPress={onPress} hitSlop={8} style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: "#173FD1", fontWeight: "800", fontSize: 10.5 }}>View All</Text>
        <Ionicons name="chevron-forward" size={13} color="#173FD1" />
      </Pressable>
    </View>
  );
}
