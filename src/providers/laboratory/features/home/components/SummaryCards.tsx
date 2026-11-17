import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function SummaryCards({
  appointments,
  homeCollections,
  reportsPending,
  earnings,
}: {
  appointments: number;
  homeCollections: number;
  reportsPending: number;
  earnings: number;
}) {
  const items = [
    ["calendar-outline", appointments, "Appointments", "#EAF1FF", "#173FD1"],
    ["bicycle-outline", homeCollections, "Home Collections", "#E8FAF1", "#14A765"],
    ["document-text-outline", reportsPending, "Reports Pending", "#FFF4DF", "#E38A00"],
    ["wallet-outline", `₹${earnings}`, "Booked Value", "#FFECEF", "#D94C67"],
  ] as const;

  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 17, marginTop: 17, padding: 13 }}>
      <Text style={{ fontWeight: "900", color: "#172033", fontSize: 13.5 }}>Today's Summary</Text>
      <View style={{ flexDirection: "row", marginTop: 13 }}>
        {items.map(([icon, value, label, bg, color]) => (
          <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={icon as any} size={16} color={color} />
            </View>
            <Text style={{ color, fontSize: 14, fontWeight: "900", marginTop: 5 }}>{value}</Text>
            <Text style={{ color: "#7B8190", fontSize: 8.5, marginTop: 2, textAlign: "center" }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
