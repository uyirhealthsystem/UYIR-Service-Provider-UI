import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { getProfile, updateProfile } from "../../../api/profile";

export default function EditProfile({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setFullName(data?.fullName || ""); setPhone(data?.phone || ""); setEmail(data?.email || ""); setAddressLine1(data?.addressLine1 || ""); setAddressLine2(data?.addressLine2 || ""); setCity(data?.city || ""); setState(data?.state || ""); setPincode(data?.pincode || "");
    } catch (error) { console.log("Edit profile load error:", error); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    try {
      setSaving(true);
      await updateProfile({ fullName, phone, email, addressLine1, addressLine2, city, state, pincode });
      Alert.alert("Saved", "Profile updated successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (error: any) { Alert.alert("Unable to save", error?.message || "Please try again."); } finally { setSaving(false); }
  };

  const field = (label: string, value: string, setter: (value: string) => void, placeholder: string, keyboardType: any = "default") => <View style={{ marginTop: 16 }}><Text style={{ color: "#344054", fontSize: 12, fontWeight: "700" }}>{label}</Text><TextInput value={value} onChangeText={setter} placeholder={placeholder} placeholderTextColor="#98A2B3" keyboardType={keyboardType} style={{ marginTop: 8, minHeight: 50, borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 13, paddingHorizontal: 14, color: "#101828", fontSize: 13 }} /></View>;

  if (!profile && !fullName) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7FB" }}><ActivityIndicator color="#1755E8" /></View>;

  return <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="arrow-back" size={21} color="#101828" /></Pressable>
    <Text style={{ marginTop: 22, color: "#101828", fontSize: 26, fontWeight: "900" }}>Personal Information</Text>
    <Text style={{ marginTop: 5, color: "#667085", fontSize: 13 }}>Keep your Health Partner details up to date.</Text>
    <View style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 19, padding: 18 }}>
      {field("Full Name", fullName, setFullName, "Full name")}
      {field("Phone", phone, setPhone, "Mobile number", "phone-pad")}
      {field("Email", email, setEmail, "Email address", "email-address")}
      {field("Address Line 1", addressLine1, setAddressLine1, "House / street")}
      {field("Address Line 2", addressLine2, setAddressLine2, "Area / landmark")}
      {field("City", city, setCity, "City")}
      {field("State", state, setState, "State")}
      {field("Pincode", pincode, setPincode, "Pincode", "number-pad")}
      <Pressable onPress={save} disabled={saving} style={{ marginTop: 22, minHeight: 52, borderRadius: 13, backgroundColor: "#1755E8", alignItems: "center", justifyContent: "center" }}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Save Changes</Text>}</Pressable>
    </View>
  </ScrollView>;
}
