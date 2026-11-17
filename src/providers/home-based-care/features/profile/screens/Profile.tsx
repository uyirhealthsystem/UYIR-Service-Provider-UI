import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../../auth/store";
import LanguageSelector from "../../../../../language/components/LanguageSelector";
import { C, ErrorBanner } from "../../../components/ui";
import { careTypeLabel, initials } from "../../../utils/format";
import { useHbcStore } from "../../provider-state/store";

export default function Profile({ navigation }: any) {
  const { profile, loading, error, refresh } = useHbcStore();
  const { logout } = useAuth();
  const name = profile?.fullName || "Care Provider";
  const hasCoords = profile?.latitude != null && profile?.longitude != null;

  const row = (icon: string, title: string, value?: string | number | null, onPress?: () => void, danger = false) => (
    <Pressable onPress={onPress} disabled={!onPress} style={{ minHeight: 62, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#EEF2F8" }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: danger ? C.redSoft : C.blueSoft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon as any} size={18} color={danger ? C.red : C.blue} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: danger ? C.red : C.ink, fontSize: 13, fontWeight: "800" }}>{title}</Text>
        {value !== undefined ? <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{value === null || value === "" ? "Not provided" : String(value)}</Text> : null}
      </View>
      {onPress && !danger ? <Ionicons name="chevron-forward" size={17} color="#9AA8BB" /> : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.blue} />} contentContainerStyle={{ paddingBottom: 26 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, backgroundColor: C.card, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }}>
          <Text style={{ color: C.ink, fontSize: 23, fontWeight: "900" }}>Profile</Text>
          <View style={{ marginTop: 16, borderRadius: 19, padding: 16, backgroundColor: C.blue, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 58, height: 58, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: C.blue, fontSize: 20, fontWeight: "900" }}>{initials(name)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{name}</Text>
              <Text style={{ color: "#DDEBFF", fontSize: 12, marginTop: 4 }}>{careTypeLabel(profile?.careType)}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate("HomeCareEditProfile")} hitSlop={10} style={{ backgroundColor: "#FFFFFF22", borderRadius: 10, padding: 8 }}>
              <Ionicons name="create-outline" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}><ErrorBanner message={error} onRetry={refresh} /></View>

        <Text style={{ marginHorizontal: 18, marginTop: 8, marginBottom: 9, color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>PROVIDER DETAILS</Text>
        <View style={{ marginHorizontal: 16, backgroundColor: C.card, borderRadius: 17, overflow: "hidden" }}>
          {row("call-outline", "Phone", profile?.phone ?? null)}
          {row("ribbon-outline", "License number", profile?.licenseNo ?? null)}
          {row("time-outline", "Experience", profile?.experienceYears != null ? `${profile.experienceYears} years` : null)}
        </View>

        <Text style={{ marginHorizontal: 18, marginTop: 20, marginBottom: 9, color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>SERVICE AREA</Text>
        <View style={{ marginHorizontal: 16, backgroundColor: C.card, borderRadius: 17, overflow: "hidden" }}>
          {row("business-outline", "City & pincode", [profile?.city, profile?.pincode].filter(Boolean).join(" · ") || null, () => navigation.navigate("HomeCareEditProfile"))}
          {row("location-outline", "Coordinates", hasCoords ? `${profile!.latitude!.toFixed(4)}, ${profile!.longitude!.toFixed(4)}` : null, () => navigation.navigate("HomeCareEditProfile"))}
          {row("pricetags-outline", "Services & rates", careTypeLabel(profile?.careType), () => navigation.navigate("HomeCareServices"))}
        </View>

        <Text style={{ marginHorizontal: 18, marginTop: 20, marginBottom: 9, color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>APP</Text>
        <View style={{ marginHorizontal: 16, backgroundColor: C.card, borderRadius: 17, overflow: "hidden" }}>
          <View style={{ minHeight: 64, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#EEF2F8" }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.blueSoft, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="language-outline" size={18} color={C.blue} />
            </View>
            <Text style={{ flex: 1, marginLeft: 12, color: C.ink, fontSize: 13, fontWeight: "800" }}>Language</Text>
            <LanguageSelector />
          </View>
          {row("log-out-outline", "Log out", undefined, () =>
            Alert.alert("Log out", "Are you sure you want to log out?", [
              { text: "Stay", style: "cancel" },
              { text: "Log out", style: "destructive", onPress: logout },
            ]), true)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
