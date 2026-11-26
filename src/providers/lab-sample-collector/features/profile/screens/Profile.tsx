import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const BG = "#F5F8FC", BLUE = "#1473E6", MUTED = "#758096", TEXT = "#172033";
import { useLabSampleCollector } from "../../provider-state/store";
import { useAuth } from "../../../../../auth/store";
import { useState } from "react";
import LanguageSelector from "../../../../../language/components/LanguageSelector";

export default function Profile({ navigation }: any) {
  const { profile, loading, updatePersonalProfile, setAvailability } = useLabSampleCollector();
  const { logout } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [qualification, setQualification] = useState(profile?.qualification || "");
  const [qualificationNumber, setQualificationNumber] = useState(profile?.qualificationNumber || "");
  const [qualificationProofUrl, setQualificationProofUrl] = useState(profile?.qualificationProofUrl || "");

  const openEditor = () => {
    setName(profile?.name || "");
    setPhone(profile?.phone || "");
    setQualification(profile?.qualification || "");
    setQualificationNumber(profile?.qualificationNumber || "");
    setQualificationProofUrl(profile?.qualificationProofUrl || "");
    setEditing(true);
  };

  const savePersonalDetails = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required fields", "Name and phone number are required.");
      return;
    }
    try {
      setUpdating(true);
      await updatePersonalProfile({
        name: name.trim(),
        phone: phone.trim(),
        qualification: qualification.trim(),
        qualificationNumber: qualificationNumber.trim(),
        qualificationProofUrl: qualificationProofUrl.trim(),
      });
      setEditing(false);
      Alert.alert("Profile updated", "Your personal details were updated.");
    } catch (error: any) {
      Alert.alert("Update failed", error?.message || "Unable to update profile.");
    } finally {
      setUpdating(false);
    }
  };
  const updateAvailability = async (isAvailable: boolean) => {
    try {
      setUpdating(true);
      await setAvailability(isAvailable);
    } catch (error: any) {
      Alert.alert("Availability update failed", error?.message || "Please try again.");
    } finally {
      setUpdating(false);
    }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}><ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Pressable onPress={() => navigation.navigate("Home")} style={{ width: 36, height: 36, justifyContent: "center" }}>
        <Ionicons name="chevron-back" size={24} color={TEXT} />
      </Pressable>
      <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900", flex: 1, marginRight: 36, textAlign: "center" }}>Profile</Text>
    </View>
    <View style={{ backgroundColor: "#fff", borderRadius: 17, padding: 17, marginTop: 16, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={29} color={BLUE} /></View>
      <View style={{ marginLeft: 12, flex: 1 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>{profile?.name || "Collector"}</Text><Text style={{ color: MUTED, fontSize: 10.5, marginTop: 3 }}>{profile?.collectorType === "INDEPENDENT" ? "Independent Sample Collector" : "LAB Sample Collector"}</Text><View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: profile?.status === "ACTIVE" ? "#E6F8EE" : "#FFF0F1", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}><Text style={{ color: profile?.status === "ACTIVE" ? "#159447" : "#B42318", fontSize: 9, fontWeight: "900" }}>{profile?.status === "ACTIVE" ? "● ACTIVE" : "● INACTIVE"}</Text></View></View>
    </View>
    {loading ? <ActivityIndicator color={BLUE} style={{ marginTop: 20 }} /> : null}
    <View style={{ backgroundColor: "#fff", borderRadius: 13, padding: 15, marginTop: 12 }}>
      <Text style={{ color: TEXT, fontWeight: "900" }}>Approval status</Text>
      <Text style={{ color: MUTED, fontSize: 11, marginTop: 5 }}>Qualification: {profile?.qualificationStatus || "PENDING"}</Text>
      <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Account: {profile?.status || "PENDING"}</Text>
      {profile?.labId ? <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Laboratory: {profile.labId}</Text> : null}
    </View>
    <Pressable disabled={updating || profile?.qualificationStatus !== "VERIFIED" || profile?.status !== "ACTIVE"} onPress={() => updateAvailability(!profile?.isAvailable)} style={{ marginTop: 12, backgroundColor: BLUE, borderRadius: 13, padding: 15, alignItems: "center", opacity: updating || profile?.qualificationStatus !== "VERIFIED" || profile?.status !== "ACTIVE" ? 0.55 : 1 }}>
      <Text style={{ color: "#fff", fontWeight: "900" }}>{updating ? "Updating…" : profile?.isAvailable ? "Go Offline" : "Go Online"}</Text>
    </Pressable>
    <View style={{ marginTop: 12, backgroundColor: "#fff", borderRadius: 13, padding: 15 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Ionicons name="language-outline" size={20} color={BLUE} />
        <Text style={{ flex: 1, marginLeft: 10, color: TEXT, fontSize: 12, fontWeight: "900" }}>Language</Text>
        <LanguageSelector />
      </View>
    </View>
    <Pressable onPress={openEditor} style={{ marginTop: 9, backgroundColor: "#fff", borderRadius: 13, padding: 15, flexDirection: "row", alignItems: "center" }}>
      <Ionicons name="person-circle-outline" size={20} color={BLUE} />
      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text style={{ color: TEXT, fontSize: 12, fontWeight: "700" }}>Personal Details</Text>
        <Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>{profile?.phone || "Add your phone number"}</Text>
      </View>
      <Ionicons name="create-outline" size={18} color={MUTED} />
    </Pressable>
    {editing ? <View style={{ marginTop: 9, backgroundColor: "#fff", borderRadius: 13, padding: 15 }}>
      <Text style={{ color: TEXT, fontWeight: "900", marginBottom: 8 }}>Edit personal details</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Full name" editable={!updating} style={{ borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 10, padding: 12, marginBottom: 9 }} />
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" editable={!updating} style={{ borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 10, padding: 12, marginBottom: 9 }} />
      <TextInput value={qualification} onChangeText={setQualification} placeholder="Qualification" editable={!updating} style={{ borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 10, padding: 12, marginBottom: 9 }} />
      <TextInput value={qualificationNumber} onChangeText={setQualificationNumber} placeholder="Qualification number" editable={!updating} style={{ borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 10, padding: 12, marginBottom: 9 }} />
      <TextInput value={qualificationProofUrl} onChangeText={setQualificationProofUrl} placeholder="Qualification proof URL" editable={!updating} style={{ borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 10, padding: 12, marginBottom: 12 }} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable disabled={updating} onPress={() => setEditing(false)} style={{ flex: 1, borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 10, padding: 12, alignItems: "center" }}>
          <Text style={{ color: TEXT, fontWeight: "800" }}>Cancel</Text>
        </Pressable>
        <Pressable disabled={updating} onPress={savePersonalDetails} style={{ flex: 1, backgroundColor: BLUE, borderRadius: 10, padding: 12, alignItems: "center", opacity: updating ? 0.6 : 1 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>{updating ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>
    </View> : null}
    <Pressable onPress={() => Alert.alert("Log out?", "End your collector session?", [{ text: "Cancel", style: "cancel" }, { text: "Log out", style: "destructive", onPress: logout }])} style={{ marginTop: 14, alignItems: "center", padding: 14 }}><Text style={{ color: "#E72B3A", fontWeight: "900", fontSize: 12 }}>Logout</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
