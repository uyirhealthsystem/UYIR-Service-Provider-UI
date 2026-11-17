import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { getReferrals } from "../../../api/referrals";

const BLUE = "#1755E8";
const DARK = "#101828";
const MUTED = "#667085";

function statusStyle(status: string) {
  const value = status.toUpperCase();
  if (["COMPLETED", "SUCCESS", "PAID", "RECEIVED"].includes(value)) return { bg: "#DDF8EA", text: "#027A48", icon: "checkmark-circle" as const };
  if (["CANCELLED", "REJECTED", "FAILED"].includes(value)) return { bg: "#FDE7E7", text: "#D92D20", icon: "close-circle" as const };
  return { bg: "#FFF1D6", text: "#B54708", icon: "time" as const };
}

export default function Referrals({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const result = await getReferrals();
      setItems(Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []);
    } catch (loadError: any) {
      console.log("HP referrals error:", loadError);
      setError(loadError?.message || "Unable to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) => String(item.status || "PENDING").toUpperCase() === filter);
  }, [items, filter]);

  const completed = items.filter((item) => ["COMPLETED", "SUCCESS", "PAID", "RECEIVED"].includes(String(item.status || "").toUpperCase())).length;
  const pending = items.filter((item) => !["COMPLETED", "SUCCESS", "PAID", "RECEIVED", "CANCELLED", "REJECTED", "FAILED"].includes(String(item.status || "").toUpperCase())).length;
  const cancelled = items.filter((item) => ["CANCELLED", "REJECTED", "FAILED"].includes(String(item.status || "").toUpperCase())).length;

  if (loading && !items.length) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7FB" }}><ActivityIndicator size="large" color={BLUE} /></View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F7FB" }}
      contentContainerStyle={{ padding: 20, paddingTop: 18, paddingBottom: 34 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View><Text style={{ color: DARK, fontSize: 26, fontWeight: "900" }}>My Referrals</Text><Text style={{ marginTop: 4, color: MUTED, fontSize: 13 }}>Track every referral and its status.</Text></View>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="people-outline" size={21} color={BLUE} /></View>
      </View>

      <View style={{ marginTop: 18, flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: 15, padding: 14 }}><Text style={{ color: MUTED, fontSize: 11 }}>Total</Text><Text style={{ marginTop: 5, color: DARK, fontWeight: "900", fontSize: 21 }}>{items.length}</Text></View>
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: 15, padding: 14 }}><Text style={{ color: MUTED, fontSize: 11 }}>Completed</Text><Text style={{ marginTop: 5, color: "#027A48", fontWeight: "900", fontSize: 21 }}>{completed}</Text></View>
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: 15, padding: 14 }}><Text style={{ color: MUTED, fontSize: 11 }}>Pending</Text><Text style={{ marginTop: 5, color: "#B54708", fontWeight: "900", fontSize: 21 }}>{pending}</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 18 }}>
        {["ALL", "COMPLETED", "PENDING", "CANCELLED"].map((value) => (
          <Pressable key={value} onPress={() => setFilter(value)} style={{ marginRight: 8, paddingHorizontal: 15, height: 36, borderRadius: 18, backgroundColor: filter === value ? BLUE : "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: filter === value ? BLUE : "#E6EAF1" }}>
            <Text style={{ color: filter === value ? "#FFFFFF" : MUTED, fontSize: 11, fontWeight: "800" }}>{value === "ALL" ? `All (${items.length})` : value === "COMPLETED" ? `Completed (${completed})` : value === "PENDING" ? `Pending (${pending})` : `Cancelled (${cancelled})`}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? <View style={{ marginTop: 15, padding: 12, borderRadius: 12, backgroundColor: "#FFF0F0" }}><Text style={{ color: "#D92D20", fontSize: 13 }}>{error}</Text></View> : null}

      {!filtered.length && !error ? <View style={{ marginTop: 30, alignItems: "center" }}><Ionicons name="people-outline" size={42} color="#B8C0CF" /><Text style={{ marginTop: 10, color: MUTED, fontWeight: "600" }}>No referrals in this category.</Text></View> : null}

      {filtered.map((item, index) => {
        const status = String(item.status || "PENDING").toUpperCase();
        const badge = statusStyle(status);
        const name = item.referredUserName || item.fullName || item.name || `Referral ${index + 1}`;
        const type = item.referredType === "CITIZEN" ? "Citizen App" : item.referredType || "Referral";
        const date = item.createdAt || item.created_at || item.referralDate || item.date;
        return (
          <Pressable key={item.id || `${name}-${index}`} onPress={() => navigation.getParent()?.getParent()?.navigate("ReferralDetails", { referral: item })} style={{ marginTop: 11, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 15, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#EEF1F6" }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: index % 2 === 0 ? "#EAF0FF" : "#F1EAFE", alignItems: "center", justifyContent: "center" }}><Text style={{ color: BLUE, fontWeight: "900" }}>{String(name).charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: DARK, fontWeight: "800", fontSize: 14 }} numberOfLines={1}>{name}</Text>
              <Text style={{ marginTop: 4, color: MUTED, fontSize: 11 }}>{type}{date ? ` • ${String(date).slice(0, 10)}` : ""}</Text>
              <Text style={{ marginTop: 5, color: BLUE, fontWeight: "800", fontSize: 12 }}>₹{item.rewardAmount ?? item.amount ?? "0.00"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: badge.bg, flexDirection: "row", alignItems: "center" }}><Ionicons name={badge.icon} size={12} color={badge.text} /><Text style={{ marginLeft: 4, color: badge.text, fontSize: 10, fontWeight: "800" }}>{status}</Text></View>
              <Ionicons name="chevron-forward" size={17} color="#98A2B3" style={{ marginTop: 9 }} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
