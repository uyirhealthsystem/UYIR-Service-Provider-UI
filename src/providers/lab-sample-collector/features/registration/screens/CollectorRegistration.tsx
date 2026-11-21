import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createCollectorProfile } from "../../../api/collector";

const styles = {
  page: { flex: 1, backgroundColor: "#F7F9FC" }, content: { padding: 22, paddingBottom: 40 },
  back: { color: "#173FD1", fontSize: 16, fontWeight: "700" as const }, eyebrow: { color: "#173FD1", fontSize: 12, fontWeight: "800" as const, letterSpacing: 1.2, marginTop: 18 },
  title: { marginTop: 8, fontSize: 28, fontWeight: "800" as const, color: "#152238" }, subtitle: { marginTop: 8, color: "#657187", lineHeight: 21 },
  card: { marginTop: 22, backgroundColor: "#fff", borderRadius: 18, padding: 17, borderWidth: 1, borderColor: "#E6EAF1" },
  label: { color: "#344054", fontSize: 13, fontWeight: "700" as const, marginTop: 13, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: "#DCE2EC", borderRadius: 11, padding: 13, color: "#152238" },
  button: { marginTop: 22, backgroundColor: "#173FD1", padding: 16, borderRadius: 12, alignItems: "center" as const },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" as const }, error: { color: "#B42318", marginTop: 12 },
} as const;

export default function CollectorRegistration({ navigation }: any) {
  const [collectorType, setCollectorType] = useState<"LAB" | "INDEPENDENT">("LAB");
  const [form, setForm] = useState({ labId: "", name: "", phone: "", qualification: "", qualificationNumber: "", qualificationProofUrl: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const setField = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const submit = async () => {
    if (submitting.current) return;
    if (!form.name.trim() || !form.phone.trim()) { setError("Enter the collector name and phone number."); return; }
    if (collectorType === "LAB" && !form.labId.trim()) { setError("Enter the laboratory ID for a LAB collector."); return; }
    submitting.current = true;
    try {
      setLoading(true); setError("");
      await createCollectorProfile({
        collectorType,
        ...(collectorType === "LAB" ? { labId: form.labId.trim() } : {}),
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: "TECHNICIAN",
        ...(form.qualification.trim() ? { qualification: form.qualification.trim() } : {}),
        ...(form.qualificationNumber.trim() ? { qualificationNumber: form.qualificationNumber.trim() } : {}),
        ...(form.qualificationProofUrl.trim() ? { qualificationProofUrl: form.qualificationProofUrl.trim() } : {}),
      });
      Alert.alert("Registration submitted", "Your collector profile was submitted. Qualification and administrator approval are separate checks.");
      navigation.replace("PendingApproval");
    } catch (caught: any) {
      if (caught?.status === 409 || /already exists/i.test(String(caught?.message || ""))) {
        navigation.replace("PendingApproval");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Unable to register collector.");
    }
    finally {
      submitting.current = false;
      setLoading(false);
    }
  };
  const field = (label: string, key: keyof typeof form, keyboardType: "default" | "phone-pad" = "default") => <View key={key}><Text style={styles.label}>{label} *</Text><TextInput value={form[key]} onChangeText={value => setField(key, value)} placeholder={label} keyboardType={keyboardType} editable={!loading} style={styles.input} /></View>;
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹  Back</Text></Pressable>
    <Text style={styles.eyebrow}>UYIR · SAMPLE COLLECTION</Text><Text style={styles.title}>Collector Registration</Text>
    <Text style={styles.subtitle}>Choose whether this technician is affiliated with a laboratory or works independently.</Text>
    <View style={styles.card}>
      <Text style={styles.label}>Collector type *</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["LAB", "INDEPENDENT"] as const).map((type) => (
          <Pressable key={type} onPress={() => setCollectorType(type)} disabled={loading} style={{ flex: 1, borderWidth: 1, borderColor: collectorType === type ? "#173FD1" : "#DCE2EC", backgroundColor: collectorType === type ? "#EAF1FF" : "#fff", borderRadius: 11, padding: 12, alignItems: "center" }}>
            <Text style={{ color: collectorType === type ? "#173FD1" : "#344054", fontWeight: "800" }}>{type === "LAB" ? "LAB technician" : "Independent"}</Text>
          </Pressable>
        ))}
      </View>
      {collectorType === "LAB" ? field("Laboratory ID", "labId") : null}
      {field("Collector full name", "name")}{field("Phone number", "phone", "phone-pad")}
      {field("Qualification", "qualification")}
      {field("Qualification number", "qualificationNumber")}
      {field("Qualification proof URL", "qualificationProofUrl")}
      <Text style={{ color: "#667085", fontSize: 12, marginTop: 10, lineHeight: 17 }}>Independent registration omits labId. Qualification verification and account activation remain backend-controlled.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={submit} disabled={loading} style={[styles.button, loading && { opacity: 0.6 }]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit registration</Text>}</Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}
