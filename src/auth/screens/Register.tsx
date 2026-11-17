import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register({ navigation }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>‹</Text>
        </Pressable>

        <Text style={{ marginTop: 18, fontSize: 28, fontWeight: "700" }}>
          Create your account
        </Text>

        <Text style={{ marginTop: 8, color: "#6B7280" }}>
          Create your provider account to get started.
        </Text>

        <TextInput
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            marginTop: 28,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />

        <TextInput
          placeholder="Confirm password"
          secureTextEntry
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />

        <Pressable
          onPress={() => navigation.navigate("OTP", { mode: "register" })}
          style={{
            marginTop: 20,
            backgroundColor: "#173FD1",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            Register
          </Text>
        </Pressable>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 20,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          <Text style={{ marginHorizontal: 12, color: "#777" }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
        </View>

        <Pressable
          style={{
            borderWidth: 1,
            borderColor: "#E1E5EC",
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "600" }}>Sign up with Google</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={{ alignItems: "center", marginTop: 22 }}
        >
          <Text style={{ color: "#6B7280" }}>
            Already have an account?{" "}
            <Text style={{ color: "#173FD1", fontWeight: "700" }}>Login</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
