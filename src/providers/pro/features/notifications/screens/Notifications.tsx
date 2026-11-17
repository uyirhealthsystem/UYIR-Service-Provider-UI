import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyCheckpoints, getMyHospitals, getMyMetrics } from "../../../api/profile";
import NotificationCard from "../components/NotificationCard";

type ProNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  screen: string;
};

export default function Notifications({ navigation }: any) {
  const [notifications, setNotifications] = useState<ProNotification[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const [checkpointsResponse, hospitalsResponse, metricsResponse] = await Promise.all([
        getMyCheckpoints(),
        getMyHospitals(),
        getMyMetrics(),
      ]);
      const checkpoints = extractRows(checkpointsResponse);
      const hospitals = extractRows(hospitalsResponse);
      const metrics = metricsResponse?.data || metricsResponse || {};
      const generated: ProNotification[] = [];

      checkpoints.forEach((hospital: any) => {
        const id = hospital?.proHospitalId || hospital?.id;
        if (!id) return;
        const name = hospital?.hospitalPool?.name || hospital?.hospital?.name || hospital?.name || "Hospital";
        generated.push({
          id: `expired-${id}`,
          type: "hospital",
          title: "Hospital claim expired",
          message: `${name} has passed its 24-hour claim window. You can remove it from your bucket.`,
          time: hospital?.blockExpiresAt ? formatTime(hospital.blockExpiresAt) : "Action required",
          read: false,
          screen: "Bucket",
        });
      });

      hospitals.forEach((hospital: any) => {
        const id = hospital?.proHospitalId || hospital?.id;
        const status = String(hospital?.status || "").toUpperCase();
        if (!id || !["HOSPITAL_REJECTED", "ADMIN_HOLD"].includes(status)) return;
        const name = hospital?.hospitalPool?.name || hospital?.hospital?.name || hospital?.name || "Hospital";
        generated.push({
          id: `status-${id}`,
          type: status === "HOSPITAL_REJECTED" ? "rejected" : "approval",
          title: status === "HOSPITAL_REJECTED" ? "Hospital onboarding rejected" : "Hospital claim on hold",
          message: `${name}: status is ${status.replace(/_/g, " ")}. Open your hospital list to review it.`,
          time: hospital?.updatedAt ? formatTime(hospital.updatedAt) : "Recent update",
          read: false,
          screen: "Onboarded",
        });
      });

      const onboarded = numberFrom(metrics, ["onboarded", "onboardedCount", "totalOnboarded", "onboardedHospitals"]);
      if (onboarded > 0) {
        generated.push({
          id: "metrics-onboarded",
          type: "approval",
          title: "Your onboarding progress",
          message: `You have onboarded ${onboarded} hospital${onboarded === 1 ? "" : "s"}. Keep up the good work.`,
          time: "Current summary",
          read: true,
          screen: "Onboarded",
        });
      }

      setNotifications(generated);
    } catch (loadError: any) {
      console.log("PRO notifications data error:", loadError);
      setError(loadError?.message || "Unable to load current updates");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadNotifications(); }, []));

  const handleNotification = (item: ProNotification) => {
    setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
    navigation.getParent()?.navigate(item.screen);
  };

  const visibleNotifications = notifications.filter((item) => !unreadOnly || !item.read);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FC" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() => navigation.goBack()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E4E7ED" }}>
              <Ionicons name="arrow-back" size={20} color="#171A2B" />
            </Pressable>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#171A2B" }}>Notifications</Text>
              <Text style={{ fontSize: 11, color: "#73798C", marginTop: 2 }}>Live updates from your PRO records</Text>
            </View>
          </View>
          <Pressable onPress={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#1747D1" }}>Mark all read</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 14, gap: 8 }}>
          <Pressable onPress={() => setUnreadOnly(false)} style={{ backgroundColor: !unreadOnly ? "#1747D1" : "#FFFFFF", paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: !unreadOnly ? "#1747D1" : "#E1E5ED" }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: !unreadOnly ? "#FFFFFF" : "#596174" }}>All ({notifications.length})</Text>
          </Pressable>
          <Pressable onPress={() => setUnreadOnly(true)} style={{ backgroundColor: unreadOnly ? "#1747D1" : "#FFFFFF", paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: unreadOnly ? "#1747D1" : "#E1E5ED" }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: unreadOnly ? "#FFFFFF" : "#596174" }}>Unread ({notifications.filter((item) => !item.read).length})</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator size="large" color="#1747D1" style={{ marginTop: 35 }} /> : error ? (
          <View style={{ marginHorizontal: 16, padding: 16, borderRadius: 12, backgroundColor: "#FFF1F1" }}>
            <Text style={{ color: "#C62828", fontSize: 12 }}>{error}</Text>
            <Pressable onPress={loadNotifications} style={{ marginTop: 10 }}><Text style={{ color: "#1747D1", fontWeight: "700" }}>Try again</Text></Pressable>
          </View>
        ) : visibleNotifications.length ? visibleNotifications.map((item) => <NotificationCard key={item.id} item={item} onPress={() => handleNotification(item)} />) : (
          <View style={{ alignItems: "center", paddingHorizontal: 30, paddingTop: 55 }}>
            <Ionicons name="notifications-off-outline" size={38} color="#9AA0AE" />
            <Text style={{ marginTop: 12, fontSize: 14, fontWeight: "700", color: "#171A2B" }}>You're all caught up</Text>
            <Text style={{ marginTop: 5, fontSize: 11, color: "#73798C", textAlign: "center" }}>No current alerts were found in your PRO records.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function extractRows(response: any): any[] {
  const candidates = [response?.data?.hospitals, response?.data?.items, response?.data, response?.hospitals, response?.items];
  return candidates.find(Array.isArray) || [];
}

function numberFrom(source: any, keys: string[]) {
  for (const key of keys) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recent update" : date.toLocaleString();
}
