import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PendingApproval({ navigation }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 52 }}>✓</Text>

        <Text
          style={{
            marginTop: 24,
            fontSize: 25,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Your account is under review
        </Text>

        <Text
          style={{
            marginTop: 12,
            textAlign: "center",
            lineHeight: 22,
            color: "#6B7280",
          }}
        >
          Thank you! Your registration has been submitted successfully.
        </Text>

        <Text style={{ marginTop: 20, textAlign: "center", color: "#6B7280" }}>
          We will notify you once your account is approved.
        </Text>

        <Pressable
          onPress={() => navigation.navigate("Login")}
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
          <Text style={{ color: "#173FD1", fontWeight: "700" }}>
            Go to Login
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
