import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";

export default function ProfileMenu({ navigation, provider }: { navigation: any; provider: any }) {
  const items = [
    ["business-outline", "Lab Details", "LabProfile"],
    ...(provider?.labId ? [["flask-outline", "Test Catalogue & Slots", "SlotsTab"]] : []),
    ...(provider?.labId ? [["list-outline", "Lab Tests", "LabTests"]] : []),
    ...(provider?.scanCenterId ? [["scan-outline", "Scan Services", "ScanServices"]] : []),
    ...(provider?.scanCenterId ? [["hardware-chip-outline", "Equipment", "Equipment"]] : []),
    ["wallet-outline", "Bank & Payout Details", "LabEarnings"],
    ["settings-outline", "Settings", "LabSettings"],
    ["help-circle-outline", "Help & Support", "LabSupport"],
  ] as const;
  return <View>{items.map(([icon, title, route]) => <Pressable key={title} onPress={() => route === "SlotsTab" ? navigation.navigate("Slots") : route === "LabTests" || route === "ScanServices" || route === "Equipment" || route === "LabEarnings" ? navigation.navigate(route) : Alert.alert(title, "This feature is waiting for the backend API.")} style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginTop: 8, flexDirection: "row", alignItems: "center" }}><Ionicons name={icon as any} size={19} color="#173FD1" /><Text style={{ flex: 1, marginLeft: 11, fontSize: 13, fontWeight: "700", color: "#343D4D" }}>{title}</Text><Ionicons name="chevron-forward" size={17} color="#9AA3B2" /></Pressable>)}</View>;
}
