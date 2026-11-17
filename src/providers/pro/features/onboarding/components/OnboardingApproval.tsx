import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingApproval({ navigation }: any) {
  const blue = "#1747D1";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <View style={{ flex: 1, padding: 20 }}>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            backgroundColor: "#EAF8F0",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 25,
          }}
        >
          <Text style={{ color: "#1DA866", fontSize: 30, fontWeight: "800" }}>✓</Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "700", color: "#171A2B", marginTop: 20 }}>
          Onboarding Completed
        </Text>

        <Text style={{ fontSize: 13, color: "#73798C", marginTop: 5 }}>
          Hospital information was submitted successfully.
        </Text>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E6E9F0",
            padding: 18,
            marginTop: 22,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#171A2B" }}>
            Status
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#1DA866",
              }}
            />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#167A4A", marginLeft: 9 }}>
              ONBOARDED
            </Text>
          </View>

          <Text style={{ fontSize: 13, color: "#73798C", lineHeight: 19, marginTop: 9 }}>
            The hospital has been added to your onboarded hospital list.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={() => navigation.navigate("ProLayout", { screen: "Onboarded" })}
          style={{
            height: 50,
            borderRadius: 9,
            backgroundColor: blue,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
            View Onboarded Hospitals
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
