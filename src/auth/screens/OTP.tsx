import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthApiError, resendLoginCode, verifyLoginCode } from "../api";
import { completeProviderLogin } from "../service";
import { useAuth } from "../store";

// Second step of email/password login. Login.tsx navigates here with the
// challenge authservice returned (POST /auth/email/login -> 202):
//   { mode: "login", challengeId, email (masked), codeLength, expiresAt, resendAvailableAt }
// The user types the emailed code -> POST /auth/email/login/verify -> tokens ->
// completeProviderLogin() (registration checks / sign in).

const secondsUntil = (iso?: string) =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000)) : 0;

const mmss = (total: number) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

// Errors after which this challenge is dead - the user must enter their password again.
function mustLogInAgain(err: AuthApiError) {
  return (
    err.code === "LOGIN_CHALLENGE_INVALID" ||
    err.code === "LOGIN_CODE_RESEND_LIMIT" ||
    (err.code === "INVALID_LOGIN_CODE" && /log in again/i.test(err.message))
  );
}

export default function OTP({ route, navigation }: any) {
  const { setUser } = useAuth();
  const params = route.params ?? {};
  const mode = params.mode;
  const challengeId: string = params.challengeId;
  const codeLength: number = params.codeLength || 6;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [expired, setExpired] = useState(false); // challenge is dead - back to login
  const [expiresAt, setExpiresAt] = useState<string | undefined>(params.expiresAt);
  const [resendAt, setResendAt] = useState<string | undefined>(params.resendAvailableAt);
  const [, tick] = useState(0);
  const submitting = useRef(false);

  // Re-render every second for the countdowns.
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const expiresIn = secondsUntil(expiresAt);
  const resendIn = secondsUntil(resendAt);
  const codeExpired = mode === "login" && Boolean(expiresAt) && expiresIn === 0;

  const verify = async (value = code) => {
    if (mode === "register") {
      navigation.replace("ProviderType");
      return;
    }
    if (submitting.current || expired) return;
    if (!challengeId) {
      setError("Sign-in session missing. Please log in again.");
      setExpired(true);
      return;
    }
    if (value.length !== codeLength) {
      setError(`Enter the ${codeLength}-digit code from your email.`);
      return;
    }

    submitting.current = true;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const tokens = await verifyLoginCode(challengeId, value);
      console.log("Login code verified");
      await completeProviderLogin(tokens, { navigation, setUser });
    } catch (err: any) {
      console.log("Login code verification error:", err);
      if (err instanceof AuthApiError) {
        setCode("");
        setError(err.message);
        if (mustLogInAgain(err)) setExpired(true);
      } else {
        setError(err?.message || "Unable to verify account");
      }
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const onChangeCode = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, codeLength);
    setCode(digits);
    if (error) setError("");
    // Submit as soon as the last digit is typed / pasted / autofilled.
    if (digits.length === codeLength) verify(digits);
  };

  const resend = async () => {
    if (resending || resendIn > 0 || expired) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      const challenge = await resendLoginCode(challengeId);
      setExpiresAt(challenge.expiresAt);
      setResendAt(challenge.resendAvailableAt);
      setCode("");
      setInfo(`A new code was sent to ${challenge.email}.`);
    } catch (err: any) {
      console.log("Resend login code error:", err);
      setError(err?.message || "Couldn't send a new code. Please try again.");
      if (err instanceof AuthApiError && mustLogInAgain(err)) setExpired(true);
    } finally {
      setResending(false);
    }
  };

  const backToLogin = () => navigation.goBack();

  // Register mode is unchanged from before login OTP: registration doesn't
  // send a code (Register.tsx doesn't call the API yet), so "Verify" just
  // moves on to ProviderType.
  if (mode === "register") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 28 }}>‹</Text>
          </Pressable>
          <Text style={{ marginTop: 24, fontSize: 28, fontWeight: "700" }}>Verify your account</Text>
          <Text style={{ marginTop: 8, color: "#6B7280", lineHeight: 21 }}>
            Enter the verification code sent to your email.
          </Text>
          <TextInput
            placeholder="Enter OTP"
            keyboardType="number-pad"
            maxLength={6}
            style={{
              marginTop: 28,
              borderWidth: 1,
              borderColor: "#E1E5EC",
              borderRadius: 12,
              padding: 16,
              fontSize: 18,
              letterSpacing: 5,
            }}
          />
          <Pressable
            onPress={() => verify()}
            style={{ marginTop: 20, backgroundColor: "#173FD1", padding: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Verify</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const canResend = !expired && !resending && resendIn === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Pressable onPress={backToLogin} accessibilityLabel="Back to login">
          <Text style={{ fontSize: 28 }}>‹</Text>
        </Pressable>

        <Text style={{ marginTop: 24, fontSize: 28, fontWeight: "700" }}>Enter sign-in code</Text>

        <Text style={{ marginTop: 8, color: "#6B7280", lineHeight: 21 }}>
          We sent a {codeLength}-digit code to{" "}
          <Text style={{ fontWeight: "700", color: "#111827" }}>{params.email || "your email"}</Text>.
        </Text>

        <TextInput
          value={code}
          onChangeText={onChangeCode}
          placeholder={"•".repeat(codeLength)}
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={codeLength}
          autoFocus
          editable={!loading && !expired}
          style={{
            marginTop: 28,
            borderWidth: 1,
            borderColor: error ? "#DC2626" : "#E1E5EC",
            borderRadius: 12,
            padding: 16,
            fontSize: 24,
            letterSpacing: 12,
            textAlign: "center",
            color: "#111827",
            opacity: expired ? 0.5 : 1,
          }}
        />

        {!expired ? (
          <Text style={{ marginTop: 10, color: codeExpired ? "#DC2626" : "#6B7280" }}>
            {codeExpired ? "This code has expired. Tap \"Resend code\" for a new one." : `Code expires in ${mmss(expiresIn)}`}
          </Text>
        ) : null}

        {error ? <Text style={{ marginTop: 12, color: "#DC2626" }}>{error}</Text> : null}
        {info ? <Text style={{ marginTop: 12, color: "#15803D" }}>{info}</Text> : null}

        {expired ? (
          <Pressable
            onPress={backToLogin}
            style={{ marginTop: 20, backgroundColor: "#173FD1", padding: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Back to login</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => verify()}
              disabled={loading || code.length !== codeLength}
              style={{
                marginTop: 20,
                backgroundColor: "#173FD1",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
                opacity: loading || code.length !== codeLength ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {loading ? "Checking..." : "Verify"}
              </Text>
            </Pressable>

            <Pressable onPress={resend} disabled={!canResend} style={{ alignItems: "center", marginTop: 20 }}>
              <Text style={{ color: canResend ? "#173FD1" : "#9CA3AF", fontWeight: "600" }}>
                {resending ? "Sending..." : resendIn > 0 ? `Resend code in ${mmss(resendIn)}` : "Resend code"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
