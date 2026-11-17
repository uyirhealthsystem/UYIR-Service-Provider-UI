import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { getDashboard } from "../../../api/healthPartner";
import { getProfile } from "../../../api/profile";

const BLUE = "#1755E8";

export default function ReferHealthPartner({ navigation }: any) {
  const [code, setCode] = useState("-");

  useFocusEffect(
    useCallback(() => {
      Promise.all([getDashboard(), getProfile()])
        .then(([dashboard, profile]) =>
          setCode(dashboard?.referralCode || profile?.referralCode || "-"),
        )
        .catch((error) => console.log("Referral code error:", error));
    }, []),
  );

  const share = async () => {
    if (code === "-") return;
    await Share.share({
      message: `Become a Uyir Health Partner using my referral code ${code}.`,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F7FB" }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
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
        Refer a Health Partner
      </Text>
      <Text style={{ marginTop: 6, color: "#667085", lineHeight: 20 }}>
        Share your unique referral code with another service provider.
      </Text>

      <View
        style={{
          marginTop: 22,
          backgroundColor: BLUE,
          borderRadius: 22,
          padding: 22,
        }}
      >
        <Text style={{ color: "#DCE6FF", fontSize: 12, fontWeight: "700" }}>
          YOUR REFERRAL CODE
        </Text>
        <Text
          style={{
            marginTop: 9,
            color: "#FFFFFF",
            fontSize: 31,
            fontWeight: "900",
            letterSpacing: 1.2,
          }}
        >
          {code}
        </Text>
        <Text style={{ marginTop: 8, color: "#DCE6FF", fontSize: 12 }}>
          The new Health Partner can enter this code during registration.
        </Text>
        <Pressable
          onPress={share}
          style={{
            marginTop: 18,
            height: 50,
            borderRadius: 14,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          <Ionicons name="share-social-outline" size={19} color={BLUE} />
          <Text style={{ marginLeft: 8, color: BLUE, fontWeight: "800" }}>
            Share Referral Code
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          marginTop: 16,
          backgroundColor: "#FFFFFF",
          borderRadius: 18,
          padding: 18,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#101828" }}>
          How it works
        </Text>
        {[
          "Share your referral code",
          "They register as a Health Partner",
          "They enter your code during registration",
          "Your referral reward is created by the service",
        ].map((item, index) => (
          <View
            key={item}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <View
              style={{
                width: 27,
                height: 27,
                borderRadius: 14,
                backgroundColor: "#EAF0FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: BLUE, fontWeight: "800", fontSize: 12 }}>
                {index + 1}
              </Text>
            </View>
            <Text
              style={{
                marginLeft: 11,
                color: "#475467",
                flex: 1,
                fontSize: 13,
              }}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
