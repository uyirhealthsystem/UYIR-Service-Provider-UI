import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AmbulanceForm({ navigation }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>‹</Text>
        </Pressable>

        <Text style={{ marginTop: 18, fontSize: 28, fontWeight: "700" }}>
          Ambulance Details
        </Text>

        <Text style={{ marginTop: 8, color: "#6B7280" }}>
          Provide your ambulance service details.
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
          placeholder="Owner name"
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
          placeholder="Number of vehicles"
          keyboardType="number-pad"
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
          }}
        />
        <TextInput
          placeholder="Ambulance registration number"
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E1E5EC",
            borderRadius: 12,
            padding: 15,
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
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            Submit for Approval
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
