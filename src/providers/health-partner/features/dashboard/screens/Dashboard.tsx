import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";

import { getDashboard } from "../../../api/healthPartner";
import { getProfile } from "../../../api/profile";

const BLUE = "#1755E8";
const DARK = "#101828";
const MUTED = "#667085";
const BG = "#F5F7FB";

export default function Dashboard({ navigation }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [dashboardData, profileData] = await Promise.all([
        getDashboard(),
        getProfile(),
      ]);
      setDashboard(dashboardData);
      setProfile(profileData);
    } catch (loadError: any) {
      console.log("HP dashboard error:", loadError);
      setError(loadError?.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shareCode = async () => {
    const code = dashboard?.referralCode || profile?.referralCode;
    if (!code) return;

    await Share.share({
      message: `Join Uyir using my Health Partner referral code ${code}.`,
    });
  };

  if (loading && !dashboard) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BG,
        }}
      >
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  const referralCode = dashboard?.referralCode || profile?.referralCode || "-";
  const totalReferrals = dashboard?.totalReferrals ?? 0;
  const totalEarnings = dashboard?.totalEarnings ?? "0.00";
  const walletBalance = dashboard?.walletBalance ?? "0.00";
  const firstName = String(profile?.fullName || "Health Partner").split(" ")[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={{ padding: 20, paddingTop: 18, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text
            style={{
              color: BLUE,
              fontSize: 20,
              fontWeight: "900",
              letterSpacing: -0.5,
            }}
          >
            Uyir
          </Text>
          <Text style={{ color: MUTED, fontSize: 11, marginTop: -2 }}>
            Health Partner
          </Text>
        </View>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#EAF0FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="notifications-outline" size={21} color={BLUE} />
        </View>
      </View>

      <Text
        style={{ marginTop: 25, color: DARK, fontSize: 25, fontWeight: "800" }}
      >
        Hi, {firstName} 👋
      </Text>
      <Text style={{ marginTop: 5, color: MUTED, fontSize: 14 }}>
        Refer people. Help them access healthcare.
      </Text>

      {error ? (
        <View
          style={{
            marginTop: 14,
            backgroundColor: "#FFF0F0",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text style={{ color: "#D92D20", fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <View
        style={{
          marginTop: 20,
          backgroundColor: BLUE,
          borderRadius: 22,
          padding: 20,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View>
            <Text style={{ color: "#DCE6FF", fontSize: 12, fontWeight: "600" }}>
              YOUR REFERRAL CODE
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 29,
                fontWeight: "900",
                letterSpacing: 1.2,
                marginTop: 8,
              }}
            >
              {referralCode}
            </Text>
          </View>
          <Pressable
            onPress={shareCode}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={{ marginTop: 9, color: "#DCE6FF", fontSize: 12 }}>
          Share your code and earn rewards on successful referrals.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <Pressable
          onPress={() => navigation.getParent()?.navigate("ReferHealthPartner")}
          style={{
            flex: 1,
            backgroundColor: "#EAF1FF",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#D6E3FF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="people-outline" size={21} color={BLUE} />
          </View>
          <Text
            style={{
              marginTop: 12,
              color: DARK,
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            Refer Health Partner
          </Text>
          <Text
            style={{ marginTop: 4, color: MUTED, fontSize: 11, lineHeight: 16 }}
          >
            Share your code
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.getParent()?.navigate("ReferCitizen")}
          style={{
            flex: 1,
            backgroundColor: "#EAFBF4",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#D2F6E6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="phone-portrait-outline" size={21} color="#039855" />
          </View>
          <Text
            style={{
              marginTop: 12,
              color: DARK,
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            Refer Citizen App
          </Text>
          <Text
            style={{ marginTop: 4, color: MUTED, fontSize: 11, lineHeight: 16 }}
          >
            Help citizens get started
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 15,
            borderWidth: 1,
            borderColor: "#EEF1F6",
          }}
        >
          <Text style={{ color: MUTED, fontSize: 12 }}>Total Referrals</Text>
          <Text
            style={{
              marginTop: 7,
              color: DARK,
              fontSize: 23,
              fontWeight: "900",
            }}
          >
            {totalReferrals}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 15,
            borderWidth: 1,
            borderColor: "#EEF1F6",
          }}
        >
          <Text style={{ color: MUTED, fontSize: 12 }}>Total Earnings</Text>
          <Text
            style={{
              marginTop: 7,
              color: DARK,
              fontSize: 23,
              fontWeight: "900",
            }}
          >
            ₹{totalEarnings}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 10,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 17,
          borderWidth: 1,
          borderColor: "#EEF1F6",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#FFF4E5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="wallet-outline" size={20} color="#F79009" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: MUTED, fontSize: 12 }}>
              Available Wallet Balance
            </Text>
            <Text
              style={{
                marginTop: 2,
                color: DARK,
                fontSize: 22,
                fontWeight: "900",
              }}
            >
              ₹{walletBalance}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate("Payments")}>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={shareCode}
        style={{
          marginTop: 16,
          backgroundColor: "#FFF7E8",
          borderRadius: 17,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "#FFE8B2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="gift-outline" size={21} color="#B54708" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: "#7A2E0E", fontWeight: "800", fontSize: 14 }}>
            Refer more, earn more
          </Text>
          <Text style={{ color: "#925F3B", fontSize: 11, marginTop: 3 }}>
            Share your referral code with people you know.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#B54708" />
      </Pressable>

      <Text
        style={{ marginTop: 24, color: DARK, fontSize: 17, fontWeight: "800" }}
      >
        Quick Actions
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <Pressable
          onPress={() => navigation.navigate("Referrals")}
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderRadius: 15,
            padding: 15,
            borderWidth: 1,
            borderColor: "#EEF1F6",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="list-outline" size={20} color={BLUE} />
          <Text
            style={{
              marginLeft: 9,
              color: DARK,
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            My Referrals
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("Payments")}
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderRadius: 15,
            padding: 15,
            borderWidth: 1,
            borderColor: "#EEF1F6",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="card-outline" size={20} color={BLUE} />
          <Text
            style={{
              marginLeft: 9,
              color: DARK,
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            Payments
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
