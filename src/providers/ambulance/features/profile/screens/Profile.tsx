import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../../auth/store";
import { getMyProfile } from "../../../api/profile";
import { addTechnician, getMyTechnicians, removeTechnician, updateTechnician } from "../../../api/technicians";

type Technician = { id?: string; technicianId?: string; fullName: string; phone: string; qualification?: string; certificationNumber?: string; available?: boolean; [key: string]: any };
const BLUE = "#1473E6", BG = "#F5F8FC", MUTED = "#6B7890", RED = "#E5484D", TEXT = "#10233F";

export default function Profile({ route }: any) {
  const { logout } = useAuth();
  const serviceType = route.params?.serviceType || "AMBULANCE";
  const isAmbulance = serviceType === "AMBULANCE";
  const [profile, setProfile] = useState<any>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [techModal, setTechModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [certificationNumber, setCertificationNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await getMyProfile();
      const data = response?.data || response;
      setProfile(data);
    } catch (error) { console.log("AMBULANCE PROFILE ERROR:", error); }
  }, []);

  const loadTechnicians = useCallback(async () => {
    try {
      const response = await getMyTechnicians();
      const rows = Array.isArray(response) ? response : response?.data || response?.technicians || response?.items || [];
      setTechnicians(Array.isArray(rows) ? rows : []);
    } catch (error) { console.log("AMBULANCE TECHNICIANS ERROR:", error); }
  }, []);

  // Refresh technician status whenever the driver returns to this profile screen.
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      void loadTechnicians();
    }, [loadProfile, loadTechnicians]),
  );

  function openTechnician(item?: Technician) {
    setEditingId(item ? String(item.id || item.technicianId || "") : null);
    setFullName(item?.fullName || "");
    setPhone(item?.phone || "");
    setQualification(item?.qualification || "");
    setCertificationNumber(item?.certificationNumber || "");
    setTechModal(true);
  }

  async function saveTechnician() {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert("Required details", "Enter the technician name and mobile number.");
      return;
    }
    try {
      setSaving(true);
      const payload = { fullName: fullName.trim(), phone: phone.trim(), qualification: qualification.trim() || undefined, certificationNumber: certificationNumber.trim() || undefined };
      if (editingId) await updateTechnician(editingId, { ...payload, available: technicians.find(t => String(t.id || t.technicianId) === editingId)?.available ?? false });
      else await addTechnician(payload);
      setTechModal(false);
      await loadTechnicians();
      Alert.alert("Saved", "Technician details have been saved.");
    } catch (error: any) {
      Alert.alert("Unable to save technician", error?.message || "Please try again.");
    } finally { setSaving(false); }
  }


  function confirmRemove(item: Technician) {
    const id = String(item.id || item.technicianId || "");
    if (!id) return;
    Alert.alert("Remove technician?", `Remove ${item.fullName} from this ambulance profile?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await removeTechnician(id); await loadTechnicians(); }
        catch (error: any) { Alert.alert("Unable to remove technician", error?.message || "Please try again."); }
      } },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900" }}>My Profile</Text>
        <View style={{ marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, alignItems: "center" }}>
          <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={36} color={BLUE} /></View>
          <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900", marginTop: 10 }}>{profile?.fullName || "Provider"}</Text>
          <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Verified Provider</Text>
        </View>
        <Text style={{ color: TEXT, fontSize: 16, fontWeight: "900", marginTop: 12, marginBottom: 10 }}>Technicians</Text>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 15, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}><Text style={{ color: TEXT, fontSize: 14, fontWeight: "900" }}>Technician Details</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>{technicians.length} registered</Text></View>
            <Pressable onPress={() => openTechnician()} style={{ backgroundColor: BLUE, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, flexDirection: "row", alignItems: "center" }}><Ionicons name="add" size={17} color="#fff" /><Text style={{ color: "#fff", fontSize: 12, fontWeight: "800", marginLeft: 4 }}>Add</Text></Pressable>
          </View>
          {technicians.length === 0 ? <Text style={{ color: MUTED, fontSize: 12, marginTop: 13, lineHeight: 18 }}>No technician details added yet. Add a technician when required.</Text> : technicians.map((item, index) => (
            <View key={String(item.id || item.technicianId || `${item.phone}-${index}`)} style={{ borderTopWidth: 1, borderTopColor: "#EEF2F6", marginTop: 13, paddingTop: 13 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}><Text style={{ color: TEXT, fontSize: 13, fontWeight: "900" }}>{item.fullName || "Technician"}</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{item.phone || "No mobile number"}{item.qualification ? ` · ${item.qualification}` : ""}</Text></View>
                <View style={{ backgroundColor: item.available ? "#E7F8EF" : "#EEF2F6", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16 }}><Text style={{ color: item.available ? "#067647" : MUTED, fontSize: 10, fontWeight: "900" }}>{item.available ? "AVAILABLE" : "OFFLINE"}</Text></View>
              </View>
              <View style={{ flexDirection: "row", marginTop: 10, gap: 9 }}>
                <Pressable onPress={() => openTechnician(item)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#EAF3FF" }}><Ionicons name="create-outline" size={15} color={BLUE} /><Text style={{ color: BLUE, fontWeight: "800", fontSize: 11, marginLeft: 5 }}>Edit details</Text></Pressable>
                <Pressable onPress={() => confirmRemove(item)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#FFF0F0" }}><Ionicons name="trash-outline" size={15} color={RED} /><Text style={{ color: RED, fontWeight: "800", fontSize: 11, marginLeft: 5 }}>Remove</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 6, backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" }}>
          {[[ "car-outline", isAmbulance ? "Ambulance Details" : "Auto Details" ],["document-text-outline","Documents"],["help-circle-outline","Help & Support"],["settings-outline","Account Settings"]].map(([icon,title]) => <View key={title} style={{ minHeight: 54, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#EEF2F6" }}><Ionicons name={icon as any} size={19} color={BLUE} /><Text style={{ flex: 1, marginLeft: 11, color: TEXT, fontSize: 12, fontWeight: "700" }}>{title}</Text><Ionicons name="chevron-forward" size={17} color={MUTED} /></View>)}
        </View>
        <Pressable onPress={logout} style={{ marginTop: 14, height: 49, borderRadius: 12, backgroundColor: "#FFF0F0", alignItems: "center", justifyContent: "center", flexDirection: "row" }}><Ionicons name="log-out-outline" size={18} color={RED} /><Text style={{ marginLeft: 8, color: RED, fontWeight: "900" }}>Logout</Text></Pressable>
      </ScrollView>
      <Modal visible={techModal} transparent animationType="slide" onRequestClose={() => setTechModal(false)}>
        <View style={{ flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: "88%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><Text style={{ color: TEXT, fontSize: 19, fontWeight: "900" }}>{editingId ? "Edit Technician" : "Add Technician"}</Text><Pressable onPress={() => setTechModal(false)}><Ionicons name="close" size={23} color={MUTED} /></Pressable></View>
            {[[ "Full name *", fullName, setFullName ],["Mobile number *", phone, setPhone],["Qualification (optional)", qualification, setQualification],["Certification number (optional)", certificationNumber, setCertificationNumber]].map(([label,value,setter]) => <View key={label as string} style={{ marginTop: 12 }}><Text style={{ color: TEXT, fontSize: 12, fontWeight: "800", marginBottom: 6 }}>{label as string}</Text><TextInput value={value as string} onChangeText={setter as any} editable={!saving} keyboardType={label === "Mobile number *" ? "phone-pad" : "default"} placeholder={label as string} style={{ borderWidth: 1, borderColor: "#DCE4EE", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: TEXT }} /></View>)}
            <Pressable onPress={saveTechnician} disabled={saving} style={{ marginTop: 20, height: 48, borderRadius: 12, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" }}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "900" }}>Save Technician</Text>}</Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
