import { Text, View } from "react-native";

export default function StatusPill({ label, color }: { label: string; color: string }) {
  return <View style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: `${color}18` }}><Text style={{ color, fontSize: 9, fontWeight: "900" }}>{label}</Text></View>;
}
