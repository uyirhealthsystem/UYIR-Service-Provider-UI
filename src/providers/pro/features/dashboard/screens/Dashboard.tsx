import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDashboard } from "../../../api/dashboard";
import { getMyProfile } from "../../../api/profile";

import CurrentBucket from "../components/CurrentBucket";
import QuickActions from "../components/QuickActions";
import QuickStats from "../components/QuickStats";
import TodayProgress from "../components/TodayProgress";

export default function Dashboard({ navigation }: any) {
  const [dashboard, setDashboard] = useState<any>(null);

  const loadDashboard = async () => {
    try {
      const profileResponse = await getMyProfile();
      const profile = profileResponse?.data || profileResponse || {};
      const proId = profile?.proId || profile?.pro?.proId || profile?.id;

      if (!proId) {
        throw new Error("PRO ID not found");
      }

      const response = await getDashboard(proId);
      setDashboard(response?.data || null);
    } catch (error) {
      console.log("Dashboard API error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FC" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View
          style={{
            backgroundColor: "#173FD1",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 25,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
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
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Good morning, {dashboard?.pro?.name || "-"} 👋
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 5,
                }}
              >
                <Ionicons name="location-outline" size={14} color="#DCE6FF" />

                <Text
                  style={{
                    color: "#DCE6FF",
                    fontSize: 12,
                    marginLeft: 4,
                  }}
                >
                  {dashboard?.pro?.districtId || "-"}, Tamil Nadu
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          <TodayProgress navigation={navigation} dashboard={dashboard} />
        </View>

        <View style={{ padding: 16 }}>
          <QuickStats dashboard={dashboard} />

          <QuickActions navigation={navigation} />

          <CurrentBucket navigation={navigation} dashboard={dashboard} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
