import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProForm({ navigation }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>‹</Text>
        </Pressable>

        <Text style={{ marginTop: 18, fontSize: 28, fontWeight: "700" }}>
          PRO Details
        </Text>

        <Text style={{ marginTop: 8, color: "#6B7280" }}>
          Complete your service provider profile.
        </Text>

        <TextInput
          placeholder="Business name"
          style={{
            marginTop: 28,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />

        <TextInput
          placeholder="Owner / Contact person"
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />

        <TextInput
          placeholder="Phone number"
          keyboardType="phone-pad"
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />

        <TextInput
          placeholder="Service area"
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />

        <TextInput
          placeholder="Business address"
          multiline
          style={{
            marginTop: 12,
            minHeight: 90,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
            textAlignVertical: "top",
          }}
        />

        <Pressable
          onPress={() => navigation.replace("PendingApproval")}
          style={{
            marginTop: 24,
            backgroundColor: "#173FD1",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            Submit for Approval
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
