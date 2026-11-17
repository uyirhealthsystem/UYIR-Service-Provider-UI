import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={{ height: 54, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E9EDF3" }}><Pressable onPress={onBack} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}><Ionicons name="chevron-back" size={24} color="#10233F" /></Pressable><Text style={{ color: "#10233F", fontSize: 17, fontWeight: "900", marginLeft: 4 }}>{title}</Text></View>;
}
