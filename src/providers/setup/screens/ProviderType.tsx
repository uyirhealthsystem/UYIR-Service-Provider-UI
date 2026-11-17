import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const providers = [
  ["PRO", "Public Relations Officer registration", "👨‍💼", "ProRegistration"],
  ["Ambulance", "Emergency and patient transport services", "🚑", "AmbulanceRegistration"],
  ["Laboratory", "Diagnostic and pathology services", "🧪", "LaboratoryRegistration"],
  ["Scan Centre", "Diagnostic imaging services", "🩻", "ScanCenterRegistration"],
  ["Doctor", "Doctor profile and clinical qualifications", "🩺", "DoctorRegistration"],
  ["Home-Based Care", "Choose nurse, caretaker or physiotherapist", "🏠", "HBCRegistrationType"],
  ["ECG on Wheels", "Mobile ECG testing at the patient's doorstep", "💙", "ECGRegistration"],
  ["Health Partner", "Community health partner profile", "🤝", "HealthPartnerRegistration"],
  ["Lab Sample Collector", "Home collection sample pickup", "🧫", "CollectorRegistration"],
];

export default function ProviderType({ navigation, route }: any) {
  const selectProvider = (screen: string) => navigation.navigate(screen, route?.params || {});
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Pressable onPress={() => navigation.goBack()}><Text style={{ fontSize: 28 }}>‹</Text></Pressable>
        <Text style={{ marginTop: 18, fontSize: 28, fontWeight: "700", color: "#111827" }}>Choose Provider Type</Text>
        <Text style={{ marginTop: 8, color: "#6B7280" }}>Select the provider profile you need to register.</Text>
        <View style={{ marginTop: 28, gap: 12 }}>
          {providers.map(([name, description, icon, screen]) => (
            <Pressable key={screen} onPress={() => selectProvider(screen)} style={{ flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#E2E6EF", borderRadius: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 25 }}>{icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#173FD1" }}>{name}</Text>
                <Text style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>{description}</Text>
              </View>
              <Text style={{ fontSize: 24, color: "#173FD1" }}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
