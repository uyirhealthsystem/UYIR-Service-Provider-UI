import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useECG } from "../../provider-state/store";
import { getProvider } from "../../../api/provider";
import { useAuth } from "../../../../../auth/store";

const items = [
  ["person-outline", "Personal Information"],
  ["car-outline", "Vehicle Details"],
  ["document-text-outline", "Documents & Verification"],
  ["card-outline", "Bank Details"],
  ["settings-outline", "Settings"],
  ["help-circle-outline", "Help & Support"],
];

const BG = "#F5F8FC";
const BLUE = "#1473E6";
const MUTED = "#6B7890";
const TEXT = "#10233F";

export default function Profile() {
  const { provider, refresh } = useECG();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(provider);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      await refresh();
      if (provider?.id || provider?.providerId) {
        try {
          const response = await getProvider(String(provider.id || provider.providerId));
          setProfile(response?.data || response?.provider || response);
        } catch (error) {
          console.log("ECG profile error:", error);
        }
      }
    };
    load();
  }, [provider?.id, provider?.providerId, refresh]));

  const signOut = () => Alert.alert("Logout", "Are you sure you want to logout?", [
    { text: "Cancel", style: "cancel" },
    { text: "Logout", style: "destructive", onPress: logout },
  ]);

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Text style={{ color: TEXT, fontSize: 24, fontWeight: "900" }}>My Profile</Text>
      <View style={{ marginTop: 15, backgroundColor: BLUE, borderRadius: 18, padding: 18, alignItems: "center" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={35} color={BLUE} /></View>
        <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 10 }}>{profile?.name || "ECG Provider"}</Text>
        <Text style={{ color: "#DDEBFF", fontSize: 11, marginTop: 3 }}>ECG on Wheels Provider</Text>
        <View style={{ marginTop: 10, backgroundColor: "#EAFBF3", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center" }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#17B26A" }} /><Text style={{ marginLeft: 6, color: "#117A4B", fontSize: 10, fontWeight: "900" }}>{profile?.status || "ACTIVE"}</Text></View>
      </View>
      <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" }}>{items.map(([icon, label]) => <Pressable key={label} onPress={() => Alert.alert(label, "This section is connected to the ECG provider profile APIs. We can add its edit screen when the backend fields are confirmed.")} style={{ minHeight: 55, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#EEF2F7" }}><Ionicons name={icon as any} size={19} color={BLUE} /><Text style={{ flex: 1, marginLeft: 12, color: TEXT, fontSize: 12, fontWeight: "700" }}>{label}</Text><Ionicons name="chevron-forward" size={17} color={MUTED} /></Pressable>)}</View>
      <Pressable onPress={signOut} style={{ marginTop: 14, height: 50, borderRadius: 12, backgroundColor: "#FFF1F2", alignItems: "center", justifyContent: "center", flexDirection: "row" }}><Ionicons name="log-out-outline" size={19} color="#D92D20" /><Text style={{ marginLeft: 8, color: "#D92D20", fontWeight: "900" }}>Logout</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
