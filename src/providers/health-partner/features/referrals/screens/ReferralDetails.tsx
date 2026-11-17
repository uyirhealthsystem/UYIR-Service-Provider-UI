import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ReferralDetails({ route, navigation }: any) {
  const item = route.params?.referral || {};
  const status = item.status || "PENDING";
  const rows = [
    ["Referral Type", item.referredType || "CITIZEN"],
    ["User ID", item.referredUserId || "-"],
    ["Referral Date", item.createdAt || item.referralDate || item.date || "-"],
    ["Reward Amount", `₹${item.rewardAmount ?? item.amount ?? "0.00"}`],
    ["Status", status],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="arrow-back" size={21} color="#101828" /></Pressable>
      <Text style={{ marginTop: 22, fontSize: 26, fontWeight: "900", color: "#101828" }}>Referral Details</Text>
      <View style={{ marginTop: 18, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#1755E8", fontSize: 20, fontWeight: "900" }}>{String(item.referredUserName || item.fullName || "R").charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1, marginLeft: 13 }}><Text style={{ color: "#101828", fontSize: 17, fontWeight: "800" }}>{item.referredUserName || item.fullName || "Referral"}</Text><Text style={{ marginTop: 4, color: "#667085", fontSize: 12 }}>{item.referredType || "CITIZEN"}</Text></View>
          <View style={{ backgroundColor: "#EAFBF4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}><Text style={{ color: "#027A48", fontSize: 10, fontWeight: "800" }}>{status}</Text></View>
        </View>
      </View>
      <View style={{ marginTop: 12, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18 }}>
        {rows.map(([label, value], index) => <View key={label} style={{ paddingVertical: 13, borderBottomWidth: index === rows.length - 1 ? 0 : 1, borderBottomColor: "#F0F2F6", flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: "#667085", fontSize: 12 }}>{label}</Text><Text style={{ color: "#101828", fontSize: 12, fontWeight: "700", maxWidth: "55%", textAlign: "right" }}>{String(value)}</Text></View>)}
      </View>
    </ScrollView>
  );
}
