import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
const TEXT = "#10233F";
export default function Header({ title, onBack, right }: any) {
  return <View style={{ height: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF" }}><Pressable onPress={onBack} hitSlop={10} style={{ width: 36 }}><Ionicons name="arrow-back" size={22} color={TEXT} /></Pressable><Text style={{ flex: 1, color: TEXT, fontSize: 17, fontWeight: "900" }}>{title}</Text>{right}</View>;
}
