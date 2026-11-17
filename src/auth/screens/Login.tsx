import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguage } from "../../language";
import LanguageSelector from "../../language/components/LanguageSelector";
import { AuthApiError, loginWithEmail, loginWithGoogle } from "../api";
import { completeProviderLogin } from "../service";
import { useAuth } from "../store";

GoogleSignin.configure({
  webClientId:
    "407194530114-h4esr7s9me5ottchk29eks8gf7sdo4sb.apps.googleusercontent.com",
});

export default function Login({ navigation }: any) {
  const { t } = useLanguage();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await loginWithEmail(email.trim(), password);

      if (result.kind === "otp") {
        // Password OK - authservice emailed a sign-in code. The OTP screen
        // verifies it and finishes the login.
        navigation.navigate("OTP", { mode: "login", ...result.challenge });
        return;
      }

      // Server has login OTP switched off (LOGIN_OTP_ENABLED=false): the
      // password step already returned tokens.
      console.log("Login successful");
      console.log("Role:", result.tokens.role);
      await completeProviderLogin(result.tokens, { navigation, setUser });
    } catch (error: any) {
      console.log("Login error:", error);
      setError(error?.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear the cached Google account so the account picker always shows
      // (lets the user switch accounts after logging out).
      await GoogleSignin.signOut().catch(() => {});

      const result = await GoogleSignin.signIn();
      if (result.type !== "success") {
        console.log("Google Sign-In cancelled");
        return;
      }

      const idToken = result.data.idToken;
      if (!idToken) {
        setError("Google sign-in failed: no ID token received.");
        return;
      }

      const login = await loginWithGoogle(idToken);

      if (login.kind === "otp") {
        // Server requires the emailed code - same OTP screen as email login.
        navigation.navigate("OTP", { mode: "login", ...login.challenge });
        return;
      }

      console.log("Google login successful");
      console.log("Role:", login.tokens.role);
      await completeProviderLogin(login.tokens, { navigation, setUser });
    } catch (error: any) {
      console.log("Google Login Error:", error);
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.IN_PROGRESS) return;
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError("Google Play Services is not available on this device.");
          return;
        }
        if (String(error.code) === "10") {
          // DEVELOPER_ERROR: SHA-1 / package name not registered in Google Cloud.
          setError("Google sign-in is not configured for this app build.");
          return;
        }
      }
      if (error instanceof AuthApiError) {
        // authservice only needs a role when it has to CREATE the account
        // (no Google identity and no password account with this email yet).
        if (error.code === "ROLE_REQUIRED") {
          setError("No account found for this Google email. Please register first, then sign in with Google.");
          return;
        }
        if (error.code === "PENDING_APPROVAL") {
          setError("Your account is awaiting administrator approval.");
          return;
        }
        if (error.status >= 500) {
          setError("Google sign-in failed on the server. Please try again or use email login.");
          return;
        }
      }
      setError(error?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 20 }}>
        <LanguageSelector />
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* Logo */}
        <View
          style={{
            alignItems: "center",
            marginBottom: 45,
          }}
        >
          <Text
            style={{
              fontSize: 34,
              fontWeight: "800",
              color: "#173FD1",
            }}
          >
            Uyir
          </Text>

          <Text
            style={{
              marginTop: 3,
              color: "#555",
            }}
          >
            Health Provider
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
          }}
        >
          {t("auth.login.title")}
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#6B7280",
          }}
        >
          {t("auth.login.subtitle")}
        </Text>

        {/* Email */}
        <TextInput
          placeholder={t("auth.login.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          placeholderTextColor="#9CA3AF"
          selectionColor="#2563EB"
          style={{
            marginTop: 28,
            height: 60,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            paddingHorizontal: 18,
            backgroundColor: "#FFFFFF",
            color: "#111827",
            fontSize: 16,
          }}
        />

        {/* Password */}
        <TextInput
          placeholder={t("auth.login.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#2563EB"
          style={{
            marginTop: 12,
            height: 60,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            paddingHorizontal: 18,
            backgroundColor: "#FFFFFF",
            color: "#111827",
            fontSize: 16,
          }}
        />

        {/* Error */}
        {error ? (
          <Text
            style={{
              marginTop: 10,
              color: "#DC2626",
            }}
          >
            {error}
          </Text>
        ) : null}

        {/* Forgot Password */}
        <Pressable
          onPress={() => navigation.navigate("ForgotPassword")}
          disabled={loading}
          style={{
            alignSelf: "flex-end",
            marginTop: 10,
          }}
        >
          <Text
            style={{
              color: "#173FD1",
              fontWeight: "600",
            }}
          >
            {t("auth.login.forgotPassword")}
          </Text>
        </Pressable>

        {/* Login */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            marginTop: 20,
            backgroundColor: "#173FD1",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            {loading ? "Logging in..." : t("auth.login.login")}
          </Text>
        </Pressable>

        {/* Divider */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 20,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "#E5E7EB",
            }}
          />

          <Text
            style={{
              marginHorizontal: 12,
              color: "#777",
            }}
          >
            {t("auth.login.or")}
          </Text>

          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "#E5E7EB",
            }}
          />
        </View>

        {/* Google Login */}
        <Pressable
          onPress={handleGoogleLogin}
          disabled={loading}
          style={{
            borderWidth: 1,
            borderColor: "#E1E5EC",
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              fontWeight: "600",
            }}
          >
            {t("auth.login.google")}
          </Text>
        </Pressable>

        {/* Register */}
        <Pressable
          onPress={() => navigation.navigate("Register")}
          disabled={loading}
          style={{
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <Text
            style={{
              color: "#6B7280",
            }}
          >
            {t("auth.login.noAccount")}{" "}
            <Text
              style={{
                color: "#173FD1",
                fontWeight: "700",
              }}
            >
              {t("auth.login.register")}
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
