import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { getPaymentHistory, getWallet, getWithdrawals } from "../../../api/payments";

const BLUE = "#1755E8";
const DARK = "#101828";
const MUTED = "#667085";

export default function Payments({ navigation }: any) {
  const [wallet, setWallet] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [walletData, historyData, withdrawalData] = await Promise.all([getWallet(), getPaymentHistory(), getWithdrawals()]);
      setWallet(walletData);
      setHistory(Array.isArray(historyData) ? historyData : Array.isArray(historyData?.data) ? historyData.data : []);
      setWithdrawals(Array.isArray(withdrawalData) ? withdrawalData : Array.isArray(withdrawalData?.data) ? withdrawalData.data : []);
    } catch (loadError: any) {
      console.log("HP payment error:", loadError);
      setError(loadError?.message || "Unable to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalEarned = useMemo(() => history.reduce((sum, item) => sum + Number(item.amount || item.rewardAmount || 0), 0), [history]);
  const received = useMemo(() => history.reduce((sum, item) => {
    const status = String(item.status || "RECEIVED").toUpperCase();
    return ["PENDING", "PROCESSING"].includes(status) ? sum : sum + Number(item.amount || item.rewardAmount || 0);
  }, 0), [history]);
  const pending = useMemo(() => history.reduce((sum, item) => {
    const status = String(item.status || "RECEIVED").toUpperCase();
    return ["PENDING", "PROCESSING"].includes(status) ? sum + Number(item.amount || item.rewardAmount || 0) : sum;
  }, 0), [history]);

  if (loading && !wallet) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7FB" }}><ActivityIndicator size="large" color={BLUE} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }} contentContainerStyle={{ padding: 20, paddingTop: 18, paddingBottom: 35 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} showsVerticalScrollIndicator={false}>
      <Text style={{ color: DARK, fontSize: 27, fontWeight: "900" }}>Payments</Text>
      <Text style={{ marginTop: 5, color: MUTED, fontSize: 13 }}>Track rewards, received and pending amounts.</Text>

      {error ? <View style={{ marginTop: 14, backgroundColor: "#FFF0F0", padding: 12, borderRadius: 12 }}><Text style={{ color: "#D92D20", fontSize: 13 }}>{error}</Text></View> : null}

      <View style={{ marginTop: 19, backgroundColor: BLUE, borderRadius: 22, padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}><View><Text style={{ color: "#DCE6FF", fontSize: 12 }}>Available Balance</Text><Text style={{ marginTop: 7, color: "#FFFFFF", fontSize: 30, fontWeight: "900" }}>₹{wallet?.walletBalance ?? "0.00"}</Text></View><View style={{ width: 45, height: 45, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}><Ionicons name="wallet" size={22} color="#FFFFFF" /></View></View>
        <Pressable onPress={() => navigation.getParent()?.getParent()?.navigate("BankDetails")} style={{ marginTop: 17, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center" }}><Ionicons name="card-outline" size={17} color="#FFFFFF" /><Text style={{ marginLeft: 8, color: "#FFFFFF", fontSize: 12, fontWeight: "700", flex: 1 }}>Manage bank account</Text><Ionicons name="chevron-forward" size={16} color="#FFFFFF" /></Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <View style={{ flex: 1, backgroundColor: "#EAFBF4", borderRadius: 16, padding: 15 }}><View style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name="arrow-down-circle" size={18} color="#039855" /><Text style={{ marginLeft: 7, color: "#027A48", fontSize: 11, fontWeight: "700" }}>Received</Text></View><Text style={{ marginTop: 8, color: DARK, fontSize: 20, fontWeight: "900" }}>₹{received.toFixed(2)}</Text></View>
        <View style={{ flex: 1, backgroundColor: "#FFF5E6", borderRadius: 16, padding: 15 }}><View style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name="time-outline" size={18} color="#F79009" /><Text style={{ marginLeft: 7, color: "#B54708", fontSize: 11, fontWeight: "700" }}>Pending</Text></View><Text style={{ marginTop: 8, color: DARK, fontSize: 20, fontWeight: "900" }}>₹{pending.toFixed(2)}</Text></View>
      </View>

      <View style={{ marginTop: 12, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 17 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="analytics-outline" size={20} color={BLUE} /></View><View style={{ marginLeft: 11 }}><Text style={{ color: MUTED, fontSize: 11 }}>Total reward transactions</Text><Text style={{ marginTop: 2, color: DARK, fontWeight: "900", fontSize: 18 }}>₹{totalEarned.toFixed(2)}</Text></View></View>
      </View>

      <Pressable onPress={() => navigation.getParent()?.getParent()?.navigate("PaymentIssue")} style={{ marginTop: 14, backgroundColor: "#FFF0F0", borderRadius: 17, padding: 16, flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FEE4E2", alignItems: "center", justifyContent: "center" }}><Ionicons name="flag-outline" size={20} color="#D92D20" /></View>
        <View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: "#B42318", fontWeight: "800", fontSize: 14 }}>Report a payment issue</Text><Text style={{ marginTop: 3, color: "#9B4A44", fontSize: 11 }}>Raise an issue if a reward or payment is missing.</Text></View>
        <Ionicons name="chevron-forward" size={18} color="#D92D20" />
      </Pressable>

      <Text style={{ marginTop: 23, color: DARK, fontSize: 17, fontWeight: "800" }}>Recent payments</Text>
      {history.slice(0, 6).map((item, index) => {
        const status = String(item.status || "RECEIVED").toUpperCase();
        const isPending = status === "PENDING" || status === "PROCESSING";
        return <View key={item.id || index} style={{ marginTop: 10, backgroundColor: "#FFFFFF", borderRadius: 15, padding: 14, flexDirection: "row", alignItems: "center" }}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isPending ? "#FFF5E6" : "#EAFBF4", alignItems: "center", justifyContent: "center" }}><Ionicons name={isPending ? "time-outline" : "checkmark-circle-outline"} size={19} color={isPending ? "#F79009" : "#039855"} /></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: DARK, fontWeight: "700", fontSize: 13 }}>{item.description || "Referral Reward"}</Text><Text style={{ marginTop: 3, color: MUTED, fontSize: 10 }}>{item.createdAt || item.date || ""}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={{ color: isPending ? "#B54708" : "#027A48", fontWeight: "900" }}>+₹{item.amount ?? "0.00"}</Text><Text style={{ marginTop: 3, color: MUTED, fontSize: 9 }}>{status}</Text></View></View>;
      })}

      <Text style={{ marginTop: 23, color: DARK, fontSize: 17, fontWeight: "800" }}>Withdrawals</Text>
      {withdrawals.slice(0, 4).map((item, index) => <View key={item.id || index} style={{ marginTop: 10, backgroundColor: "#FFFFFF", borderRadius: 15, padding: 14, flexDirection: "row", justifyContent: "space-between" }}><View><Text style={{ color: DARK, fontWeight: "700", fontSize: 13 }}>Withdrawal</Text><Text style={{ marginTop: 4, color: MUTED, fontSize: 10 }}>{item.createdAt || item.date || ""}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={{ color: DARK, fontWeight: "900" }}>₹{item.amount ?? "0.00"}</Text><Text style={{ marginTop: 4, color: "#B54708", fontSize: 10, fontWeight: "700" }}>{item.status || "PENDING"}</Text></View></View>)}
    </ScrollView>
  );
}
