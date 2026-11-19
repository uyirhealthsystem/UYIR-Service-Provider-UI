import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AuthApiError,
  PROVIDER_ROLES,
  loginWithGoogle,
  registerWithEmail,
} from "../api";
import { completeProviderLogin } from "../service";
import { useAuth } from "../store";

// Sign-up for the service-provider app.
//
// authservice (POST /auth/email/register) needs the provider role up front on
// this multi-role portal, and every new account is PENDING until an admin
// approves it. After approval the user logs in, and completeProviderLogin()
// sends them to their provider's own registration form (PRO -> ABHA, etc.).

const BLUE = "#173FD1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const input = {
  marginTop: 12,
  borderWidth: 1,
  borderColor: "#E1E5EC",
  borderRadius: 12,
  padding: 15,
  color: "#111827",
} as const;

export default function Register({ navigation }: any) {
  const { setUser } = useAuth();
  const [role, setRole] = useState("");
  const [rolePicker, setRolePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);

  const selected = PROVIDER_ROLES.find((item) => item.role === role);

  const clearError = () => {
    if (error) setError("");
    if (emailTaken) setEmailTaken(false);
  };

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Login");
  };

  const showPending = (accountEmail?: string) =>
    navigation.reset({
      index: 1,
      routes: [
        { name: "Login", params: { email: accountEmail } },
        { name: "PendingApproval", params: { email: accountEmail, roleLabel: selected?.label } },
      ],
    });

  const handleRegister = async () => {
    if (loading) return;
    const trimmedEmail = email.trim();
    if (!role) return setError("Choose the type of provider you are.");
    if (!EMAIL_RE.test(trimmedEmail)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    try {
      setLoading(true);
      clearError();
      const result = await registerWithEmail(trimmedEmail, password, role);
      if (result.pendingApproval) {
        showPending(result.email || trimmedEmail);
      } else {
        // Auto-approved portal: the account can log in straight away.
        navigation.reset({ index: 0, routes: [{ name: "Login", params: { email: trimmedEmail } }] });
      }
    } catch (err: any) {
      if (err instanceof AuthApiError && err.code === "EMAIL_TAKEN") {
        setEmailTaken(true);
        setError("An account with this email already exists.");
      } else {
        setError(err?.message || "Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (loading) return;
    if (!role) return setError("Choose the type of provider you are before signing up with Google.");
    try {
      setLoading(true);
      clearError();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut().catch(() => {});
      const result = await GoogleSignin.signIn();
      if (result.type !== "success") return;
      const idToken = result.data.idToken;
      if (!idToken) return setError("Google sign-up failed: no ID token received.");

      // A new account is created with this role, then held for approval
      // (authservice answers 403 PENDING_APPROVAL). An existing approved
      // account just logs in with its stored role.
      const login = await loginWithGoogle(idToken, role);
      if (login.kind === "otp") {
        navigation.navigate("OTP", { mode: "login", ...login.challenge });
        return;
      }
      await completeProviderLogin(login.tokens, { navigation, setUser });
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.IN_PROGRESS) return;
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          return setError("Google Play Services is not available on this device.");
        }
        if (String(err.code) === "10") return setError("Google sign-in is not configured for this app build.");
      }
      if (err instanceof AuthApiError && err.code === "PENDING_APPROVAL") {
        showPending();
        return;
      }
      setError(err?.message || "Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={goBack} disabled={loading} accessibilityLabel="Back">
          <Text style={{ fontSize: 28 }}>‹</Text>
        </Pressable>

        <Text style={{ marginTop: 18, fontSize: 28, fontWeight: "700", color: "#111827" }}>
          Create your account
        </Text>
        <Text style={{ marginTop: 8, color: "#6B7280", lineHeight: 21 }}>
          Choose your provider type and sign up. An administrator reviews every new account before you can log in.
        </Text>

        <Text style={{ marginTop: 26, fontWeight: "700", color: "#344054" }}>I am a</Text>
        <Pressable
          onPress={() => setRolePicker(true)}
          disabled={loading}
          style={[input, { flexDirection: "row", alignItems: "center", marginTop: 8 }]}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>{selected?.icon || "👤"}</Text>
          <Text style={{ flex: 1, color: selected ? "#111827" : "#9CA3AF", fontSize: 15 }}>
            {selected ? selected.label : "Select provider type"}
          </Text>
          <Text style={{ color: BLUE, fontSize: 16 }}>▾</Text>
        </Pressable>

        <TextInput
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          value={email}
          onChangeText={(v) => { setEmail(v); clearError(); }}
          editable={!loading}
          style={[input, { marginTop: 16 }]}
        />
        <TextInput
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={(v) => { setPassword(v); clearError(); }}
          editable={!loading}
          style={input}
        />
        <TextInput
          placeholder="Confirm password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoComplete="new-password"
          value={confirm}
          onChangeText={(v) => { setConfirm(v); clearError(); }}
          editable={!loading}
          style={input}
        />

        {error ? (
          <View style={{ marginTop: 14, backgroundColor: "#FEF3F2", borderRadius: 10, padding: 12 }}>
            <Text style={{ color: "#B42318", lineHeight: 19 }}>{error}</Text>
            {emailTaken ? (
              <View style={{ flexDirection: "row", gap: 18, marginTop: 8 }}>
                <Pressable onPress={() => navigation.navigate("Login", { email: email.trim() })}>
                  <Text style={{ color: BLUE, fontWeight: "700" }}>Log in</Text>
                </Pressable>
                <Pressable onPress={() => navigation.navigate("ForgotPassword", { email: email.trim() })}>
                  <Text style={{ color: BLUE, fontWeight: "700" }}>Forgot password?</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={{ marginTop: 20, backgroundColor: BLUE, padding: 16, borderRadius: 12, alignItems: "center", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Register</Text>
          )}
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          <Text style={{ marginHorizontal: 12, color: "#777" }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
        </View>

        <Pressable
          onPress={handleGoogleSignUp}
          disabled={loading}
          style={{ borderWidth: 1, borderColor: "#E1E5EC", padding: 15, borderRadius: 12, alignItems: "center", opacity: loading ? 0.7 : 1 }}
        >
          <Text style={{ fontWeight: "600", color: "#111827" }}>Sign up with Google</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")} style={{ alignItems: "center", marginTop: 22 }}>
          <Text style={{ color: "#6B7280" }}>
            Already have an account? <Text style={{ color: BLUE, fontWeight: "700" }}>Login</Text>
          </Text>
        </Pressable>
      </ScrollView>

      <Modal visible={rolePicker} transparent animationType="slide" onRequestClose={() => setRolePicker(false)}>
        <View style={{ flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" }}>
          <View style={{ maxHeight: "80%", backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 12 }}>
              Choose provider type
            </Text>
            <ScrollView>
              {PROVIDER_ROLES.map((item) => {
                const active = item.role === role;
                return (
                  <Pressable
                    key={item.role}
                    onPress={() => { setRole(item.role); setRolePicker(false); clearError(); }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 13,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderRadius: 12,
                      borderColor: active ? BLUE : "#E2E6EF",
                      backgroundColor: active ? "#EEF4FF" : "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 22, width: 36 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: active ? BLUE : "#111827" }}>{item.label}</Text>
                      <Text style={{ marginTop: 2, fontSize: 12, color: "#6B7280" }}>{item.description}</Text>
                    </View>
                    {active ? <Text style={{ color: BLUE, fontWeight: "800" }}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setRolePicker(false)} style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ color: BLUE, fontWeight: "800" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
