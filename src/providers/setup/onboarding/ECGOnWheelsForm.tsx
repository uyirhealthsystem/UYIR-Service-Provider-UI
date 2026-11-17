import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createProvider } from "../../ecg-on-wheels/api/createProvider";

export default function ECGOnWheelsForm({ route, navigation }: any) {
  const sub = route.params?.sub || "";
  const [name, setName] = useState("");
  const [technician, setTechnician] = useState("");
  const [mobile, setMobile] = useState("");
  const [area, setArea] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !technician.trim() || !mobile.trim()) {
      Alert.alert("Missing details", "Please enter provider name, technician name and phone number.");
      return;
    }

    try {
      setLoading(true);
      await createProvider({
        name: technician.trim() || name.trim(),
        userId: sub,
        mobile: mobile.trim(),
        email: "",
      });

      Alert.alert("Submitted", "Your ECG on Wheels provider details were submitted for approval.", [
        { text: "OK", onPress: () => navigation.replace("PendingApproval") },
      ]);
    } catch (error: any) {
      Alert.alert("Registration failed", error?.message || "Unable to register ECG provider.");
    } finally {
      setLoading(false);
    }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={{ fontSize: 28, color: "#10233F" }}>‹</Text></Pressable>
      <Text style={{ marginTop: 18, fontSize: 28, fontWeight: "800", color: "#10233F" }}>ECG on Wheels Details</Text>
      <Text style={{ marginTop: 8, color: "#6B7280", lineHeight: 19 }}>Add your mobile ECG service details for provider verification.</Text>
      <TextInput placeholder="Provider / Business name" value={name} onChangeText={setName} style={{ marginTop: 28, borderWidth: 1, borderColor: "#E1E5EC", borderRadius: 12, padding: 15 }} />
      <TextInput placeholder="ECG Technician name" value={technician} onChangeText={setTechnician} style={{ marginTop: 12, borderWidth: 1, borderColor: "#E1E5EC", borderRadius: 12, padding: 15 }} />
      <TextInput placeholder="Phone number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" style={{ marginTop: 12, borderWidth: 1, borderColor: "#E1E5EC", borderRadius: 12, padding: 15 }} />
      <TextInput placeholder="Service area" value={area} onChangeText={setArea} style={{ marginTop: 12, borderWidth: 1, borderColor: "#E1E5EC", borderRadius: 12, padding: 15 }} />
      <TextInput placeholder="Vehicle number" value={vehicle} onChangeText={setVehicle} style={{ marginTop: 12, borderWidth: 1, borderColor: "#E1E5EC", borderRadius: 12, padding: 15 }} />
      <Pressable disabled={loading} onPress={submit} style={{ marginTop: 24, backgroundColor: "#1473E6", padding: 16, borderRadius: 12, alignItems: "center", opacity: loading ? 0.6 : 1 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>{loading ? "Submitting..." : "Submit for Approval"}</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}
