import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { getDashboard } from "../../../api/healthPartner";
import { getProfile } from "../../../api/profile";

const BLUE = "#1755E8";

export default function ReferCitizen({ navigation }: any) {
  const [code, setCode] = useState("-");

  useFocusEffect(useCallback(() => {
    Promise.all([getDashboard(), getProfile()])
      .then(([dashboard, profile]) => setCode(dashboard?.referralCode || profile?.referralCode || "-"))
      .catch((error) => console.log("Citizen referral code error:", error));
  }, []));

  const share = async () => {
    if (code === "-") return;
    await Share.share({ message: `Download the Uyir Citizen App and use my referral code ${code} while creating your profile.` });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="arrow-back" size={21} color="#101828" />
      </Pressable>
      <Text style={{ marginTop: 22, fontSize: 27, fontWeight: "900", color: "#101828" }}>Refer a Citizen</Text>
      <Text style={{ marginTop: 6, color: "#667085", lineHeight: 20 }}>Help a citizen install the Uyir app and use your referral code during registration.</Text>

      <View style={{ marginTop: 22, backgroundColor: BLUE, borderRadius: 22, padding: 22 }}>
        <Text style={{ color: "#DCE6FF", fontSize: 12, fontWeight: "700" }}>YOUR REFERRAL CODE</Text>
        <Text style={{ marginTop: 9, color: "#FFFFFF", fontSize: 31, fontWeight: "900", letterSpacing: 1.2 }}>{code}</Text>
        <Pressable onPress={share} style={{ marginTop: 18, height: 52, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
          <Ionicons name="share-outline" size={19} color={BLUE} />
          <Text style={{ marginLeft: 8, color: BLUE, fontWeight: "800" }}>Share Citizen App</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 16, backgroundColor: "#EAFBF4", borderRadius: 18, padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#D2F6E6", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="phone-portrait-outline" size={22} color="#039855" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: "#027A48", fontWeight: "800", fontSize: 15 }}>What to tell the citizen</Text>
            <Text style={{ marginTop: 4, color: "#356B55", fontSize: 12, lineHeight: 18 }}>Install the Uyir Citizen App and enter your referral code during profile setup.</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18 }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#101828" }}>How it works</Text>
        {["Share the Citizen app", "Citizen installs and registers", "Citizen enters your referral code", "Referral appears in My Referrals"].map((item, index) => (
          <View key={item} style={{ flexDirection: "row", alignItems: "center", marginTop: 15 }}>
            <View style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: BLUE, fontWeight: "800", fontSize: 12 }}>{index + 1}</Text>
            </View>
            <Text style={{ marginLeft: 11, color: "#475467", flex: 1, fontSize: 13 }}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
