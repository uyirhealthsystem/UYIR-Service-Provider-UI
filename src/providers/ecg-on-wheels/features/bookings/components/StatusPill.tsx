import { Text, View } from "react-native";
const BLUE = "#1473E6";
export default function StatusPill({ label, color = BLUE }: any) {
 return <View style={{ alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: `${color}18` }}><Text style={{ color, fontSize: 9, fontWeight: "900" }}>{label}</Text></View>;
}
