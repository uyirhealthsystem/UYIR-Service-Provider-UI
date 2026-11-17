import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

export default function PrimaryButton({ title, onPress, disabled, icon }: { title: string; onPress: () => void; disabled?: boolean; icon?: any }) {
  return <Pressable disabled={disabled} onPress={onPress} style={{ height: 49, borderRadius: 12, backgroundColor: "#1473E6", alignItems: "center", justifyContent: "center", flexDirection: "row", opacity: disabled ? 0.55 : 1 }}>{icon ? <Ionicons name={icon} size={18} color="#FFFFFF" /> : null}<Text style={{ color: "#FFFFFF", fontWeight: "900", marginLeft: icon ? 7 : 0 }}>{title}</Text></Pressable>;
}
