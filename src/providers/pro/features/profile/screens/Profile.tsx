import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../../../auth/store";
import { getMyMetrics, getMyProfile } from "../../../api/profile";

export default function Profile({ navigation }: any) {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id || user?.userId || user?.sub;

  const loadProfile = async () => {
    if (!userId) {
      setError("User information not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("========== PRO PROFILE ==========");
      console.log("User ID:", userId);

      const [profileResponse, metricsResponse] = await Promise.all([
        getMyProfile(userId),
        getMyMetrics(userId),
      ]);

      console.log("PRO PROFILE RESPONSE:", profileResponse);
      console.log("PRO METRICS RESPONSE:", metricsResponse);

      setProfile(profileResponse?.data || null);
      setMetrics(metricsResponse?.data || null);
    } catch (error: any) {
      console.log("PRO profile API error:", error);

      setError(error?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [userId]),
  );

  const handleLogout = () => {
    logout();
  };

  const getInitials = () => {
    const name = profile?.name || "PRO";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item: string) => item[0])
      .join("")
      .toUpperCase();
  };

  const getMetric = (...keys: string[]) => {
    for (const key of keys) {
      if (metrics?.[key] !== undefined && metrics?.[key] !== null) {
        return metrics[key];
      }
    }

    return 0;
  };

  const onboarded = getMetric("onboarded", "onboardedCount", "totalOnboarded");

  const visits = getMetric("visits", "visitCount", "totalVisits");

  const earnings = getMetric("earnings", "totalEarnings");

  const district =
    profile?.districtId || profile?.district?.name || profile?.district || "-";

  const status = profile?.status || "UNKNOWN";

  const isActive = status.toUpperCase() === "ACTIVE";

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F5F7FB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#173FD1" />

        <Text
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "#73798C",
          }}
        >
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F5F7FB",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#173FD1",
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#FFFFFF",
            }}
          >
            Profile
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 21,
                  fontWeight: "800",
                  color: "#173FD1",
                }}
              >
                {getInitials()}
              </Text>
            </View>

            <View
              style={{
                marginLeft: 14,
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#FFFFFF",
                }}
              >
                {profile?.name || "-"}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  color: "#DCE5FF",
                  marginTop: 4,
                }}
              >
                {profile?.proId || profile?.id || "-"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isActive ? "#E9FFF3" : "#FFF1F1",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: isActive ? "#16A34A" : "#DC4444",
                  marginRight: 6,
                }}
              />

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isActive ? "#16804D" : "#DC4444",
                }}
              >
                {status}
              </Text>
            </View>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#FFF1F1",
            }}
          >
            <Text
              style={{
                color: "#C62828",
                fontSize: 13,
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Assigned Area */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: "#171A2B",
              marginBottom: 14,
            }}
          >
            Assigned Area
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#EEF3FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="location-outline" size={21} color="#1747D1" />
            </View>

            <View
              style={{
                marginLeft: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#171A2B",
                }}
              >
                {district}
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  color: "#73798C",
                  marginTop: 3,
                }}
              >
                Assigned district
              </Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: "#171A2B",
              marginBottom: 16,
            }}
          >
            Performance
          </Text>

          <View
            style={{
              flexDirection: "row",
            }}
          >
            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#16A34A",
                }}
              >
                {onboarded}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: "#73798C",
                  marginTop: 4,
                }}
              >
                Onboarded
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: "#E8EBF1",
              }}
            />

            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#1747D1",
                }}
              >
                {visits}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: "#73798C",
                  marginTop: 4,
                }}
              >
                Visits
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: "#E8EBF1",
              }}
            />

            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#7B5CE6",
                }}
              >
                {typeof earnings === "number"
                  ? `₹${earnings.toLocaleString("en-IN")}`
                  : earnings || "₹0"}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: "#73798C",
                  marginTop: 4,
                }}
              >
                Earnings
              </Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: "#171A2B",
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            Account
          </Text>

          <Pressable
            onPress={() => console.log("Personal Details")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          >
            <Ionicons name="person-outline" size={20} color="#596174" />

            <Text
              style={{
                flex: 1,
                marginLeft: 13,
                fontSize: 13,
                fontWeight: "600",
                color: "#252A3A",
              }}
            >
              Personal Details
            </Text>

            <Ionicons name="chevron-forward" size={18} color="#A0A6B4" />
          </Pressable>

          <View
            style={{
              height: 1,
              backgroundColor: "#EEF0F4",
              marginLeft: 49,
            }}
          />

          <Pressable
            onPress={() => navigation.getParent()?.navigate("Notifications")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#596174" />

            <Text
              style={{
                flex: 1,
                marginLeft: 13,
                fontSize: 13,
                fontWeight: "600",
                color: "#252A3A",
              }}
            >
              Notifications
            </Text>

            <Ionicons name="chevron-forward" size={18} color="#A0A6B4" />
          </Pressable>

          <View
            style={{
              height: 1,
              backgroundColor: "#EEF0F4",
              marginLeft: 49,
            }}
          />

          <Pressable
            onPress={() => console.log("Language")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          >
            <Ionicons name="language-outline" size={20} color="#596174" />

            <Text
              style={{
                flex: 1,
                marginLeft: 13,
                fontSize: 13,
                fontWeight: "600",
                color: "#252A3A",
              }}
            >
              Language
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: "#73798C",
                marginRight: 8,
              }}
            >
              English
            </Text>

            <Ionicons name="chevron-forward" size={18} color="#A0A6B4" />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#F0D8D8",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="log-out-outline" size={19} color="#DC4444" />

          <Text
            style={{
              marginLeft: 8,
              fontSize: 13,
              fontWeight: "700",
              color: "#DC4444",
            }}
          >
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
