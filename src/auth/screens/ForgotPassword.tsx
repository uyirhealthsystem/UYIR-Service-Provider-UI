import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPassword() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Forgot Password</Text>
      </View>
    </SafeAreaView>
  );
}
