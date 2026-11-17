import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ReferHub({ navigation }: any) {
  const BLUE = "#1755E8";
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F7FB" }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="arrow-back" size={21} color="#101828" />
      </Pressable>
      <Text
        style={{
          marginTop: 22,
          fontSize: 27,
          fontWeight: "900",
          color: "#101828",
        }}
      >
        Refer
      </Text>
      <Text style={{ marginTop: 6, color: "#667085" }}>
        Choose who you want to refer.
      </Text>
      <Pressable
        onPress={() => navigation.navigate("ReferHealthPartner")}
        style={{
          marginTop: 24,
          backgroundColor: "#EAF0FF",
          borderRadius: 20,
          padding: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 15,
            backgroundColor: "#D6E3FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="people" size={24} color={BLUE} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#101828" }}>
            Refer Health Partner
          </Text>
          <Text style={{ marginTop: 4, color: "#667085", fontSize: 12 }}>
            Share your partner referral code.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("ReferCitizen")}
        style={{
          marginTop: 12,
          backgroundColor: "#EAFBF4",
          borderRadius: 20,
          padding: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 15,
            backgroundColor: "#D2F6E6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="phone-portrait" size={24} color="#039855" />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#101828" }}>
            Refer Citizen App
          </Text>
          <Text style={{ marginTop: 4, color: "#667085", fontSize: 12 }}>
            Share the app and your referral code.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
      </Pressable>
    </ScrollView>
  );
}
