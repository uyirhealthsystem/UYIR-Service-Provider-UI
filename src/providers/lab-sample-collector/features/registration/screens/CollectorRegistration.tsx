import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createCollectorProfile } from "../../../api/registration";

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
  const [form, setForm] = useState({ labId: "", name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setField = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const submit = async () => {
    if (!form.labId.trim() || !form.name.trim() || !form.phone.trim()) { setError("Enter the laboratory ID, collector name and phone number."); return; }
    try {
      setLoading(true); setError("");
      await createCollectorProfile({ labId: form.labId.trim(), name: form.name.trim(), phone: form.phone.trim(), status: "ACTIVE" });
      Alert.alert("Registration submitted", "Sample collector profile submitted.", [{ text: "Continue", onPress: () => navigation.replace("PendingApproval") }]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to register collector."); }
    finally { setLoading(false); }
  };
  const field = (label: string, key: keyof typeof form, keyboardType: "default" | "phone-pad" = "default") => <View key={key}><Text style={styles.label}>{label} *</Text><TextInput value={form[key]} onChangeText={value => setField(key, value)} placeholder={label} keyboardType={keyboardType} editable={!loading} style={styles.input} /></View>;
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹  Back</Text></Pressable>
    <Text style={styles.eyebrow}>UYIR · SAMPLE COLLECTION</Text><Text style={styles.title}>Collector Registration</Text>
    <Text style={styles.subtitle}>Register a collector against a laboratory. Only fields supported by POST /api/v1/collector are collected here.</Text>
    <View style={styles.card}>{field("Laboratory ID", "labId")}{field("Collector full name", "name")}{field("Phone number", "phone", "phone-pad")}
      <Text style={{ color: "#667085", fontSize: 12, marginTop: 10, lineHeight: 17 }}>The backend contract currently supports labId, name, phone and status. Ask the backend team before adding qualification or document fields.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={submit} disabled={loading} style={[styles.button, loading && { opacity: 0.6 }]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit registration</Text>}</Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}
