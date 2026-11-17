import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function TodaySummary() {
  const items = [
    { icon: "calendar-outline", value: "3", label: "Appointments", bg: "#EAF1FF", color: "#173FD1" },
    { icon: "bicycle-outline", value: "6", label: "Home Collections", bg: "#E8FAF1", color: "#14A765" },
    { icon: "document-text-outline", value: "4", label: "Reports Pending", bg: "#FFF4DF", color: "#E38A00" },
    { icon: "wallet-outline", value: "₹4,560", label: "Today's Earnings", bg: "#FFECEF", color: "#159447" },
  ] as const;

  return (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 17, marginTop: 17, paddingHorizontal: 10, paddingTop: 13, paddingBottom: 11 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 3 }}>
        <Text style={{ fontWeight: "900", color: "#172033", fontSize: 13.5 }}>Today's Summary</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "#173FD1", fontSize: 10, fontWeight: "800" }}>Today</Text>
          <Ionicons name="chevron-down" size={13} color="#173FD1" style={{ marginLeft: 2 }} />
        </View>
      </View>
      <View style={{ flexDirection: "row", marginTop: 13 }}>
        {items.map((item) => (
          <View key={item.label} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: item.bg, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <Text style={{ color: item.label === "Today's Earnings" ? "#159447" : "#173FD1", fontSize: item.label === "Today's Earnings" ? 14 : 16, fontWeight: "900", marginTop: 5 }}>
              {item.value}
            </Text>
            <Text style={{ color: "#7B8190", fontSize: 8.5, marginTop: 2, textAlign: "center" }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
