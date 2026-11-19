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
import {
  getAccessToken,
  getAuthUserId,
  getRefreshToken,
} from "../../../auth/session";
import { useAuth } from "../../../auth/store";
import { getUserIdFromAccessToken } from "../../../auth/token";
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
/**
 * The PRO service identifies the caller by the auth-service user id (token
 * `sub`). Login passes it as a route param, but the screen can also be reached
 * from Register → Choose Provider Type, so fall back to the signed-in session.
 */
function resolveIdentity(params: any = {}) {
  const accessToken: string = params.accessToken || getAccessToken() || "";
  const refreshToken: string = params.refreshToken || getRefreshToken() || "";
  const sub: string =
    params.sub ||
    getAuthUserId() ||
    (accessToken ? getUserIdFromAccessToken(accessToken) || "" : "");
  return { sub, accessToken, refreshToken, role: params.role || "PRO" };
}

export default function ProRegistration({ route, navigation }: any) {
  const { setUser } = useAuth();
  const { sub, role, accessToken, refreshToken } = resolveIdentity(route.params);
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
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const busy = loading || requestingOtp;

  const goBack = () => {
    // Login opens this screen with replace(), so there may be nothing to go back to.
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Login");
  };

  const changeAbhaNumber = () => {
    // The backend verifies the OTP against the ABHA number it was sent for,
    // so editing the number means requesting a fresh OTP.
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  const requestOtp = async () => {
    if (busy) return;
    if (!sub) {
      setError("User ID is missing. Please login again.");
      return;
    }
    if (!/^\d{14}$/.test(abhaNumber.replace(/[\s-]/g, ""))) {
      setError("Enter a valid 14-digit ABHA number.");
      return;
    }
    try {
      setRequestingOtp(true);
      setError("");
      setProUserId(sub);
      await sendProAbhaOtp(abhaNumber, sub);
      setOtp("");
      setOtpSent(true);
      Alert.alert(
        "OTP requested",
        "Enter the OTP sent through ABDM to continue.",
      );
    } catch (e: any) {
      setError(e?.message || "Unable to request ABHA OTP.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const validate = (): string => {
    if (!otpSent) return "Request the ABHA OTP first.";
    if (!/^\d{6}$/.test(otp.trim())) return "Enter the 6-digit OTP sent to your ABHA-linked mobile.";
    if (!name.trim()) return "Enter your full name.";
    if (!/^[6-9]\d{9}$/.test(phone.trim())) return "Enter a valid 10-digit mobile number.";
    if (!districtId.trim()) return "Select your district.";
    const date = joiningDate.trim();
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      return "Enter the joining date as YYYY-MM-DD, e.g. 2026-11-19.";
    }
    if (parsed.getTime() > Date.now()) return "Joining date cannot be in the future.";
    return "";
  };

  const submit = async () => {
    if (busy) return;
    if (!sub) {
      setError("User ID is missing. Please login again.");
      return;
    }
    const problem = validate();
    if (problem) {
      setError(problem);
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
    opts: { maxLength?: number; editable?: boolean; digitsOnly?: boolean } = {},
  ) => {
    const editable = opts.editable ?? !busy;
    return (
      <View>
        <Text style={styles.label}>{label} *</Text>
        <TextInput
          value={value}
          onChangeText={(v) => {
            set(opts.digitsOnly ? v.replace(/\D/g, "") : v);
            if (error) setError("");
          }}
          placeholder={label}
          placeholderTextColor="#98A2B3"
          keyboardType={kb}
          maxLength={opts.maxLength}
          editable={editable}
          style={[styles.input, !editable && { backgroundColor: "#F2F4F7", color: "#667085" }]}
        />
      </View>
    );
  };
  if (!sub) {
    // Not signed in (e.g. came from Register → Choose Provider Type). The PRO
    // service needs the auth user id, so ask the user to log in first.
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={goBack}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.eyebrow}>UYIR · PUBLIC RELATIONS OFFICER</Text>
          <Text style={styles.title}>PRO Registration</Text>
          <View style={styles.card}>
            <Text style={{ color: "#152238", fontSize: 16, fontWeight: "800" }}>
              Log in to continue
            </Text>
            <Text style={styles.hint}>
              PRO registration is linked to your Uyir account. Log in with your
              PRO account; if you haven't registered yet, you'll be brought back
              here to verify your ABHA number.
            </Text>
            <Pressable
              onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={goBack} disabled={busy}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>UYIR · PUBLIC RELATIONS OFFICER</Text>
        <Text style={styles.title}>PRO Registration</Text>
        <Text style={styles.subtitle}>
          Verify your ABHA number with ABDM, then complete your profile.
        </Text>
        <View style={styles.card}>
          {field("ABHA number", abhaNumber, setAbhaNumber, "number-pad", {
            maxLength: 17,
            editable: !otpSent && !busy,
          })}
          {otpSent ? (
            <Pressable onPress={changeAbhaNumber} disabled={busy}>
              <Text style={[styles.hint, { color: "#173FD1", fontWeight: "700" }]}>
                Change ABHA number
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={requestOtp}
            disabled={busy}
            style={[styles.button, busy && { opacity: 0.6 }]}
          >
            {requestingOtp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {otpSent ? "Request OTP again" : "Send ABHA OTP"}
              </Text>
            )}
          </Pressable>
          {otpSent ? (
            <>
              {field("ABHA OTP", otp, setOtp, "number-pad", { maxLength: 6, digitsOnly: true })}
              {field("Full name", name, setName)}
              {field("Mobile number", phone, setPhone, "phone-pad", { maxLength: 10, digitsOnly: true })}
              <Text style={styles.label}>District *</Text>
              <Pressable
                onPress={() => setDistrictPicker(true)}
                disabled={busy}
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
              disabled={busy}
              style={[styles.button, busy && { opacity: 0.6 }]}
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
                    setError("");
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
