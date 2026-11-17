import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function QuickActions({ navigation }: { navigation: any }) {
  const actions = [
    ["calendar-outline", "Bookings", "Appointments", "#EAF1FF", "#173FD1"],
    ["time-outline", "Test Slots", "Slots", "#E8FAF1", "#14A765"],
    ["document-text-outline", "Reports", "Reports", "#FFF4DF", "#E38A00"],
  ] as const;

  return (
    <View>
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#172033", marginBottom: 11 }}>Quick Actions</Text>
      <View style={{ flexDirection: "row", gap: 9 }}>
        {actions.map(([icon, title, route, bg, color]) => (
          <Pressable key={title} onPress={() => navigation.navigate(route)} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 15, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "#E8ECF3" }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Text style={{ marginTop: 7, fontSize: 9.5, fontWeight: "800", color: "#343D4D", textAlign: "center" }}>{title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
