import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { getProfile } from "../../../api/profile";
import { getDashboard } from "../../../api/healthPartner";
import { useAuth } from "../../../../../auth/store";

const BLUE = "#1755E8";

export default function Profile({ navigation }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [code, setCode] = useState("-");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [profileData, dashboardData] = await Promise.all([getProfile(), getDashboard()]);
      setProfile(profileData);
      setCode(dashboardData?.referralCode || profileData?.referralCode || "-");
    } catch (loadError: any) {
      console.log("HP profile error:", loadError);
      setError(loadError?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !profile) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7FB" }}><ActivityIndicator size="large" color={BLUE} /></View>;

  const initial = String(profile?.fullName || "H").charAt(0).toUpperCase();
  const location = [profile?.districtName, profile?.blockName, profile?.villageName].filter(Boolean).join(" • ");

  const menu = [
    { icon: "person-outline" as const, title: "Personal Information", subtitle: "Name, phone, address", action: () => navigation.getParent()?.getParent()?.navigate("EditProfile") },
    { icon: "card-outline" as const, title: "Bank Details", subtitle: "Manage withdrawal account", action: () => navigation.getParent()?.getParent()?.navigate("BankDetails") },
    { icon: "key-outline" as const, title: "Referral Code", subtitle: code, action: () => navigation.getParent()?.getParent()?.navigate("ReferHub") },
    { icon: "help-circle-outline" as const, title: "Payment Help", subtitle: "Report a payment issue", action: () => navigation.getParent()?.getParent()?.navigate("PaymentIssue") },
  ];

  return <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }} contentContainerStyle={{ padding: 20, paddingTop: 18, paddingBottom: 35 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} showsVerticalScrollIndicator={false}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><View><Text style={{ color: "#101828", fontSize: 27, fontWeight: "900" }}>My Profile</Text><Text style={{ marginTop: 4, color: "#667085", fontSize: 13 }}>Manage your Health Partner account.</Text></View><View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="settings-outline" size={20} color={BLUE} /></View></View>
    {error ? <View style={{ marginTop: 14, backgroundColor: "#FFF0F0", padding: 12, borderRadius: 12 }}><Text style={{ color: "#D92D20", fontSize: 13 }}>{error}</Text></View> : null}

    <View style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" }}><Text style={{ color: BLUE, fontSize: 25, fontWeight: "900" }}>{initial}</Text></View>
      <View style={{ flex: 1, marginLeft: 14 }}><Text style={{ color: "#101828", fontSize: 18, fontWeight: "900" }}>{profile?.fullName || "Health Partner"}</Text><Text style={{ marginTop: 4, color: "#667085", fontSize: 12 }}>{profile?.email || profile?.phone || ""}</Text><Text style={{ marginTop: 3, color: "#667085", fontSize: 11 }}>{location || "Health Partner"}</Text></View>
      <View style={{ backgroundColor: "#EAFBF4", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 }}><Text style={{ color: "#027A48", fontSize: 9, fontWeight: "800" }}>{profile?.status || "ACTIVE"}</Text></View>
    </View>

    <View style={{ marginTop: 12, backgroundColor: BLUE, borderRadius: 18, padding: 17, flexDirection: "row", alignItems: "center" }}><View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.17)", alignItems: "center", justifyContent: "center" }}><Ionicons name="gift-outline" size={21} color="#FFFFFF" /></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: "#DCE6FF", fontSize: 11 }}>YOUR REFERRAL CODE</Text><Text style={{ marginTop: 3, color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 1 }}>{code}</Text></View></View>

    <View style={{ marginTop: 15, backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden" }}>
      {menu.map((item, index) => <Pressable key={item.title} onPress={item.action} style={{ padding: 16, flexDirection: "row", alignItems: "center", borderBottomWidth: index === menu.length - 1 ? 0 : 1, borderBottomColor: "#F0F2F6" }}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#F2F5FF", alignItems: "center", justifyContent: "center" }}><Ionicons name={item.icon} size={19} color={BLUE} /></View><View style={{ flex: 1, marginLeft: 12 }}><Text style={{ color: "#101828", fontWeight: "700", fontSize: 13 }}>{item.title}</Text><Text style={{ marginTop: 3, color: "#98A2B3", fontSize: 10 }}>{item.subtitle}</Text></View><Ionicons name="chevron-forward" size={18} color="#98A2B3" /></Pressable>)}
    </View>

    <Pressable onPress={logout} style={{ marginTop: 18, minHeight: 52, borderRadius: 14, backgroundColor: "#FEE4E2", alignItems: "center", justifyContent: "center", flexDirection: "row" }}><Ionicons name="log-out-outline" size={19} color="#D92D20" /><Text style={{ marginLeft: 8, color: "#D92D20", fontWeight: "800" }}>Logout</Text></Pressable>
  </ScrollView>;
}
