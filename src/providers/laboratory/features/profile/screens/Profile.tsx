import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../../auth/store";
import { getProviderContext } from "../../../api/laboratory";
import LanguageSelector from "../../../../../language/components/LanguageSelector";

const BLUE = "#075DE8";
const NAVY = "#10254B";
const MUTED = "#78869C";
const BORDER = "#E4EBF5";

export default function Profile() {
  const [provider, setProvider] = useState<any>(null);
  const { logout } = useAuth();
  const load = async () => { try { const context = await getProviderContext(); setProvider(context.lab || context.scanCenter); } catch (e) { console.log("Lab profile API error:", e); } };
  useFocusEffect(useCallback(() => { load(); }, []));
  const signOut = () => Alert.alert("Log out?", "Are you sure you want to log out of Uyir Service Provider?", [{ text: "Cancel", style: "cancel" }, { text: "Log out", style: "destructive", onPress: logout }]);
  const profileName = provider?.name || provider?.labName || provider?.scanCenterName || "Lab & Scan Provider";
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FC" }} edges={["top"]}>
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
      <Text style={{ color: NAVY, fontSize: 25, fontWeight: "900" }}>Profile</Text>
      <Text style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>Manage your account preferences</Text>
      <View style={{ marginTop: 18, backgroundColor: BLUE, borderRadius: 18, padding: 19, flexDirection: "row", alignItems: "center" }}><View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}><Ionicons name="flask" size={30} color="#FFFFFF"/></View><View style={{ flex: 1, marginLeft: 13 }}><Text numberOfLines={2} style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{profileName}</Text><Text style={{ color: "#DCE8FF", fontSize: 11, marginTop: 5 }}>{provider?.labId ? "Laboratory Service Provider" : provider?.scanCenterId ? "Scan Center Provider" : "Service Provider"}</Text><View style={{ alignSelf: "flex-start", marginTop: 9, borderRadius: 20, backgroundColor: "#E4F9EE", paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center" }}><Ionicons name="checkmark-circle" size={13} color="#13834B"/><Text style={{ color: "#13834B", fontSize: 9, fontWeight: "900", marginLeft: 5 }}>{provider?.status || "Provider profile"}</Text></View></View></View>
      <Text style={{ color: NAVY, fontSize: 14, fontWeight: "900", marginTop: 24, marginBottom: 10 }}>Account</Text>
      <Pressable onPress={() => Alert.alert("Profile details", [provider?.name ? `Name: ${provider.name}` : null, provider?.phone ? `Phone: ${provider.phone}` : null, provider?.email ? `Email: ${provider.email}` : null, provider?.address ? `Address: ${provider.address}` : null].filter(Boolean).join("\n") || "Provider details are not available from the current API response.")} style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 15, flexDirection: "row", alignItems: "center" }}><View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person-outline" size={20} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: NAVY, fontSize: 12, fontWeight: "900" }}>Profile Details</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>View your registered provider information</Text></View><Ionicons name="chevron-forward" size={18} color={MUTED}/></Pressable>
      <View style={{ marginTop: 11, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 15, flexDirection: "row", alignItems: "center" }}><View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="language-outline" size={20} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: NAVY, fontSize: 12, fontWeight: "900" }}>Language</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>Choose English or Tamil</Text></View><LanguageSelector/></View>
      <Pressable onPress={signOut} style={{ marginTop: 22, backgroundColor: "#FFF0F1", borderRadius: 14, borderWidth: 1, borderColor: "#FFD4D8", padding: 16, alignItems: "center", justifyContent: "center", flexDirection: "row" }}><Ionicons name="log-out-outline" size={19} color="#D92D20"/><Text style={{ color: "#D92D20", fontWeight: "900", fontSize: 13, marginLeft: 8 }}>Log out</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
