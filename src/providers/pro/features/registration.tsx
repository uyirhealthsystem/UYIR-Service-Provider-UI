import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../auth/store";
import { setProUserId } from "../api/client";
import { registerPro, sendProAbhaOtp } from "../api/registration";
import { DISTRICT_OPTIONS } from "./onboarding/data/onboardingOptions";

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
    marginTop: 14,
    backgroundColor: "#173FD1",
    padding: 14,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  error: { color: "#B42318", marginTop: 12 },
  hint: { color: "#667085", fontSize: 12, lineHeight: 17, marginTop: 8 },
} as const;
export default function ProRegistration({ route, navigation }: any) {
  const { setUser } = useAuth();
  const sub = route.params?.sub;
  const role = route.params?.role || "PRO";
  const accessToken = route.params?.accessToken;
  const refreshToken = route.params?.refreshToken;
  const [abhaNumber, setAbhaNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [districtPicker, setDistrictPicker] = useState(false);
  const [joiningDate, setJoiningDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = async () => {
    if (!sub) {
      setError("User ID is missing. Please login again.");
      return;
    }
    if (!/^\d{2}-?\d{4}-?\d{4}-?\d{4}$/.test(abhaNumber.replace(/\s/g, ""))) {
      setError("Enter a valid ABHA number.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setProUserId(sub);
      await sendProAbhaOtp(abhaNumber, sub);
      setOtpSent(true);
      Alert.alert(
        "OTP requested",
        "Enter the OTP sent through ABDM to continue.",
      );
    } catch (e: any) {
      setError(e?.message || "Unable to request ABHA OTP.");
    } finally {
      setLoading(false);
    }
  };
  const submit = async () => {
    if (!sub) {
      setError("User ID is missing. Please login again.");
      return;
    }
    if (
      !otpSent ||
      !otp.trim() ||
      !name.trim() ||
      !phone.trim() ||
      !districtId.trim() ||
      !joiningDate.trim()
    ) {
      setError("Verify ABHA OTP and complete all required fields.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await registerPro({
        userId: sub,
        otp,
        name,
        phone,
        districtId,
        joiningDate,
      });
      setUser({
        id: sub,
        sub,
        providerType: role,
        role,
        accessToken,
        refreshToken,
      });
    } catch (e: any) {
      setError(e?.message || "Unable to register PRO.");
    } finally {
      setLoading(false);
    }
  };
  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    kb?: any,
    optional = false,
  ) => (
    <View>
      <Text style={styles.label}>
        {label}
        {optional ? " (optional)" : " *"}
      </Text>
      <TextInput
        value={value}
        onChangeText={set}
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
        <Text style={styles.eyebrow}>UYIR · PUBLIC RELATIONS OFFICER</Text>
        <Text style={styles.title}>PRO Registration</Text>
        <Text style={styles.subtitle}>
          Verify your ABHA number with ABDM, then complete your profile.
        </Text>
        <View style={styles.card}>
          {field("ABHA number", abhaNumber, setAbhaNumber)}
          <Pressable
            onPress={requestOtp}
            disabled={loading}
            style={styles.button}
          >
            {loading && !otpSent ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {otpSent ? "Request OTP again" : "Send ABHA OTP"}
              </Text>
            )}
          </Pressable>
          {otpSent ? (
            <>
              {field("ABHA OTP", otp, setOtp, "number-pad")}
              {field("Full name", name, setName)}
              {field("Mobile number", phone, setPhone, "phone-pad")}
              <Text style={styles.label}>District *</Text>
              <Pressable
                onPress={() => setDistrictPicker(true)}
                style={styles.input}
              >
                <Text style={{ color: districtId ? "#152238" : "#98A2B3" }}>
                  {districtId || "Select district"} ▾
                </Text>
              </Pressable>
              {field("Joining date (YYYY-MM-DD)", joiningDate, setJoiningDate)}
              <Text style={styles.hint}>
                Your PRO profile is created after ABHA OTP verification. Enter
                only the details required by the PRO service.
              </Text>
            </>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {otpSent ? (
            <Pressable
              onPress={submit}
              disabled={loading}
              style={[styles.button, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP & register</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      <Modal
        visible={districtPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setDistrictPicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0006",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              maxHeight: "70%",
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 18,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: "#152238",
                marginBottom: 12,
              }}
            >
              Select district
            </Text>
            <ScrollView>
              {DISTRICT_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => {
                    setDistrictId(d);
                    setDistrictPicker(false);
                  }}
                  style={{
                    paddingVertical: 13,
                    borderBottomWidth: 1,
                    borderBottomColor: "#EEF1F6",
                  }}
                >
                  <Text
                    style={{
                      color: districtId === d ? "#173FD1" : "#152238",
                      fontWeight: districtId === d ? "800" : "400",
                    }}
                  >
                    {districtId === d ? "✓ " : ""}
                    {d}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setDistrictPicker(false)}
              style={{ padding: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#173FD1", fontWeight: "800" }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
