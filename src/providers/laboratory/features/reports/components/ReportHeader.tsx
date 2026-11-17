import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
export default function ReportHeader({ title, onBack }: { title: string; onBack: () => void }) { return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 }}><Pressable onPress={onBack} style={{ width: 36 }}><Ionicons name="chevron-back" size={24} color="#172033" /></Pressable><Text style={{ fontSize: 18, fontWeight: "800", color: "#172033" }}>{title}</Text><View style={{ width: 36 }} /></View>; }
