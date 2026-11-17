import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useECG } from "../../provider-state/store";

const BG = "#F5F8FC";
const BLUE = "#1473E6";
const MUTED = "#6B7890";
const TEXT = "#10233F";

export default function Reports({ navigation }: any) {
  const { completedBookings, refresh, loading } = useECG();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} refreshing={loading} onRefresh={refresh}>
      <Text style={{ color: TEXT, fontSize: 24, fontWeight: "900" }}>ECG Reports</Text>
      <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>Reports from completed ECG visits.</Text>
      {completedBookings.map((r) => <Pressable key={r.id} onPress={() => navigation.navigate("ECGBookingDetails", { bookingId: r.id })} style={{ marginTop: 13, backgroundColor: "#FFFFFF", borderRadius: 15, padding: 14, flexDirection: "row", alignItems: "center" }}><View style={{ width: 43, height: 43, borderRadius: 12, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="document-text" size={22} color={BLUE} /></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: TEXT, fontWeight: "900", fontSize: 13 }}>{r.patient}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{r.id} • {r.date || "Completed"}</Text></View><Ionicons name="chevron-forward" size={18} color={MUTED} /></Pressable>)}
      {!completedBookings.length ? <View style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 30, alignItems: "center" }}><Ionicons name="document-text-outline" size={40} color={BLUE} /><Text style={{ color: TEXT, fontWeight: "900", marginTop: 10 }}>No reports yet</Text></View> : null}
    </ScrollView>
  </SafeAreaView>;
}
