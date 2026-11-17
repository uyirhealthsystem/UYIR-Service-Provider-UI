import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
const BLUE = "#1473E6", MUTED = "#6B7890", TEXT = "#10233F";
export default function DetailRow({ icon, title, value }: any) {
 return <View style={{ flexDirection: "row", marginTop: 16 }}><View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name={icon} size={17} color={BLUE} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ fontSize: 10, color: MUTED }}>{title}</Text><Text style={{ marginTop: 3, fontSize: 12, color: TEXT, fontWeight: "700", lineHeight: 17 }}>{value}</Text></View></View>;
}
