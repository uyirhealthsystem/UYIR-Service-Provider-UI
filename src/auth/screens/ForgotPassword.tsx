import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthApiError, requestPasswordReset, resetPassword } from "../api";

// Forgot / set password, against authservice:
//   1. POST /auth/password/forgot { email }        -> a 6-digit code is emailed
//      (always 202, so it never reveals whether the email has an account)
//   2. POST /auth/password/reset { email, otp, password } -> 204
// The same flow lets a Google-only account set its first password. Resetting
// signs the account out on every device. Codes expire after 10 minutes.

const BLUE = "#173FD1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_S = 60;

const input = {
  marginTop: 12,
  borderWidth: 1,
  borderColor: "#E1E5EC",
  borderRadius: 12,
  padding: 15,
  color: "#111827",
} as const;

export default function ForgotPassword({ navigation, route }: any) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState<string>(route?.params?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const goBack = () => {
    if (step === "reset" && !loading) {
      setStep("email");
      setError("");
      setInfo("");
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Login");
  };

  const sendCode = async (isResend = false) => {
    if (loading) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await requestPasswordReset(trimmed);
      setEmail(trimmed);
      setStep("reset");
      setCode("");
      setResendIn(RESEND_COOLDOWN_S);
      setInfo(
        isResend
          ? "A new code has been sent. Use the most recent one."
          : `If an account exists for ${trimmed}, we've emailed a 6-digit code. It expires in 10 minutes.`,
      );
    } catch (err: any) {
      setError(err?.message || "Unable to send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    if (loading) return;
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    try {
      setLoading(true);
      setError("");
      await resetPassword(email, code, password);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login", params: { email, notice: "Password updated. Log in with your new password." } }],
      });
    } catch (err: any) {
      if (err instanceof AuthApiError && err.code === "INVALID_RESET_CODE") {
        setError("This code is invalid or has expired. Check the latest email or request a new code.");
      } else {
        setError(err?.message || "Unable to reset your password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onChange = (set: (v: string) => void) => (v: string) => {
    set(v);
    if (error) setError("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={goBack} disabled={loading} accessibilityLabel="Back">
          <Text style={{ fontSize: 28 }}>‹</Text>
        </Pressable>

        <Text style={{ marginTop: 18, fontSize: 28, fontWeight: "700", color: "#111827" }}>
          {step === "email" ? "Forgot password" : "Set a new password"}
        </Text>
        <Text style={{ marginTop: 8, color: "#6B7280", lineHeight: 21 }}>
          {step === "email"
            ? "Enter the email you use to log in. We'll send you a code to set a new password. Signed up with Google? Use this to add a password."
            : `Enter the code sent to ${email} and choose a new password.`}
        </Text>

        {step === "email" ? (
          <TextInput
            placeholder="Email address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={onChange(setEmail)}
            editable={!loading}
            onSubmitEditing={() => sendCode()}
            style={[input, { marginTop: 26 }]}
          />
        ) : (
          <>
            {info ? (
              <View style={{ marginTop: 18, backgroundColor: "#ECFDF3", borderRadius: 10, padding: 12 }}>
                <Text style={{ color: "#067647", lineHeight: 19 }}>{info}</Text>
              </View>
            ) : null}
            <TextInput
              placeholder="6-digit code"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChangeText={onChange((v) => setCode(v.replace(/\D/g, "")))}
              editable={!loading}
              style={[input, { marginTop: 16, fontSize: 18, letterSpacing: 6 }]}
            />
            <TextInput
              placeholder="New password (min 8 characters)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={onChange(setPassword)}
              editable={!loading}
              style={input}
            />
            <TextInput
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoComplete="new-password"
              value={confirm}
              onChangeText={onChange(setConfirm)}
              editable={!loading}
              style={input}
            />
          </>
        )}

        {error ? (
          <View style={{ marginTop: 14, backgroundColor: "#FEF3F2", borderRadius: 10, padding: 12 }}>
            <Text style={{ color: "#B42318", lineHeight: 19 }}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => (step === "email" ? sendCode() : submitReset())}
          disabled={loading}
          style={{ marginTop: 20, backgroundColor: BLUE, padding: 16, borderRadius: 12, alignItems: "center", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {step === "email" ? "Send code" : "Update password"}
            </Text>
          )}
        </Pressable>

        {step === "reset" ? (
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18 }}>
            <Pressable onPress={() => sendCode(true)} disabled={loading || resendIn > 0}>
              <Text style={{ color: resendIn > 0 ? "#9CA3AF" : BLUE, fontWeight: "700" }}>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </Text>
            </Pressable>
            <Pressable onPress={goBack} disabled={loading}>
              <Text style={{ color: BLUE, fontWeight: "700" }}>Change email</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login", params: { email: email.trim() } }] })}
          style={{ alignItems: "center", marginTop: 26 }}
        >
          <Text style={{ color: "#6B7280" }}>
            Remembered it? <Text style={{ color: BLUE, fontWeight: "700" }}>Back to login</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
