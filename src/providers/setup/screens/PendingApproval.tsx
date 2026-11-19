import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Shown after (a) creating an account on Register - authservice holds every
// service-provider account for admin approval - and (b) submitting a
// provider profile form. Register passes `email` / `roleLabel`.
export default function PendingApproval({ navigation, route }: any) {
  const email: string | undefined = route?.params?.email;
  const roleLabel: string | undefined = route?.params?.roleLabel;
  const fromSignUp = Boolean(email || roleLabel);

  const goToLogin = () =>
    navigation.reset({ index: 0, routes: [{ name: "Login", params: email ? { email } : undefined }] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 52 }}>✓</Text>

        <Text style={{ marginTop: 24, fontSize: 25, fontWeight: "700", textAlign: "center", color: "#111827" }}>
          {fromSignUp ? "Account created" : "Your account is under review"}
        </Text>

        <Text style={{ marginTop: 12, textAlign: "center", lineHeight: 22, color: "#6B7280" }}>
          {fromSignUp
            ? `Your ${roleLabel ? `${roleLabel} ` : ""}account${email ? ` for ${email}` : ""} is waiting for administrator approval.`
            : "Thank you! Your registration has been submitted successfully."}
        </Text>

        <Text style={{ marginTop: 16, textAlign: "center", lineHeight: 22, color: "#6B7280" }}>
          {fromSignUp
            ? "Once it's approved, log in with your email and password. You'll then complete your provider profile."
            : "We will notify you once your account is approved."}
        </Text>

        <Pressable
          onPress={goToLogin}
          style={{
            marginTop: 32,
            width: "100%",
            borderWidth: 1,
            borderColor: "#173FD1",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#173FD1", fontWeight: "700" }}>Go to Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
