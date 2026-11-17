import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const BG = "#F5F8FC", BLUE = "#1473E6", MUTED = "#758096", TEXT = "#172033";

const rows = [["person-circle-outline", "Personal Details"], ["document-text-outline", "My Documents"], ["wallet-outline", "Earnings & Payouts"], ["help-circle-outline", "Help & Support"], ["settings-outline", "App Settings"]];
export default function Profile() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}><ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
    <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900" }}>Profile</Text>
    <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 17, marginTop: 16, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={29} color={BLUE} /></View>
      <View style={{ marginLeft: 12 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>Arun Kumar</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 3 }}>Lab Sample Collector</Text><View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: "#E6F8EE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}><Text style={{ color: "#159447", fontSize: 9, fontWeight: "900" }}>● ONLINE</Text></View></View>
    </View>
    {rows.map(([icon, label]) => <Pressable key={label} style={{ marginTop: 9, backgroundColor: "#fff", borderRadius: 13, padding: 15, flexDirection: "row", alignItems: "center" }}><Ionicons name={icon as any} size={19} color={BLUE} /><Text style={{ flex: 1, marginLeft: 11, color: TEXT, fontSize: 12, fontWeight: "700" }}>{label}</Text><Ionicons name="chevron-forward" size={17} color="#A0A8B6" /></Pressable>)}
    <Pressable style={{ marginTop: 14, alignItems: "center", padding: 14 }}><Text style={{ color: "#E72B3A", fontWeight: "900", fontSize: 12 }}>Logout</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
