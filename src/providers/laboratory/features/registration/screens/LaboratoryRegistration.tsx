import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createLabRegistration } from "../../../api/registration";
const styles = {
  page: { flex: 1, backgroundColor: "#F7F9FC" },
  content: { padding: 22, paddingBottom: 40 },
  back: { color: "#173FD1", fontSize: 16, fontWeight: "700" },
  eyebrow: {
    color: "#173FD1",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 18,
  },
  title: { marginTop: 8, fontSize: 28, fontWeight: "800", color: "#152238" },
  subtitle: { marginTop: 8, color: "#657187", lineHeight: 21 },
  card: {
    marginTop: 22,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E6EAF1",
  },
  label: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 13,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE2EC",
    borderRadius: 11,
    padding: 13,
    color: "#152238",
  },
  button: {
    marginTop: 22,
    backgroundColor: "#173FD1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  error: { color: "#B42318", marginTop: 12 },
} as const;
export default function LaboratoryRegistration({ navigation }: any) {
  const [f, S] = useState({
    name: "",
    registrationNumber: "",
    phone: "",
    address: "",
    districtId: "",
  });
  const [loading, L] = useState(false);
  const [error, E] = useState("");
  const set = (k: string, v: string) => S((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (
      !f.name.trim() ||
      !f.registrationNumber.trim() ||
      !f.phone.trim() ||
      !f.districtId.trim()
    ) {
      E("Lab name, registration number, phone and district are required.");
      return;
    }
    try {
      L(true);
      E("");
      await createLabRegistration({
        ...f,
        name: f.name.trim(),
        registrationNumber: f.registrationNumber.trim(),
        phone: f.phone.trim(),
        address: f.address.trim(),
        districtId: f.districtId.trim(),
      });
      Alert.alert("Registration submitted", "Laboratory profile submitted.", [
        {
          text: "Continue",
          onPress: () => navigation.replace("PendingApproval"),
        },
      ]);
    } catch (e: any) {
      E(e?.message || "Unable to register laboratory.");
    } finally {
      L(false);
    }
  };
  const field = (label: string, k: string, kb?: any) => (
    <View>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        value={(f as any)[k]}
        onChangeText={(v) => set(k, v)}
        placeholder={label}
        keyboardType={kb}
        editable={!loading}
        style={styles.input}
      />
    </View>
  );
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>UYIR · PROVIDER ONBOARDING</Text>
        <Text style={styles.title}>Laboratory Registration</Text>
        <Text style={styles.subtitle}>
          Create your lab profile with the Lab & Scan service.
        </Text>
        <View style={styles.card}>
          {field("Laboratory name", "name")}
          {field("Registration number", "registrationNumber")}
          {field("Phone number", "phone", "phone-pad")}
          {field("Address", "address")}
          {field("District ID", "districtId")}
          <Text
            style={{
              color: "#667085",
              fontSize: 12,
              marginTop: 10,
              lineHeight: 17,
            }}
          >
            The current collection creates labs through POST /api/v1/lab. It
            does not define a lab-photo upload field.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            onPress={submit}
            disabled={loading}
            style={[styles.button, loading && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit registration</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
