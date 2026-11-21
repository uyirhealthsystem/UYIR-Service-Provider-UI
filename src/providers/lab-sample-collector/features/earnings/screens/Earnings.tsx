import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLabSampleCollector } from "../../provider-state/store";

const BG = "#F5F8FC";
const MUTED = "#758096";
const TEXT = "#172033";
const BLUE = "#1473E6";

export default function Earnings({ navigation }: any) {
  const { earnings, loading, refresh } = useLabSampleCollector();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => navigation.navigate("Home")} style={{ width: 36, height: 36, justifyContent: "center" }}>
            <Ionicons name="chevron-back" size={24} color={TEXT} />
          </Pressable>
          <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900", flex: 1, marginRight: 36, textAlign: "center" }}>Earnings</Text>
        </View>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Collector payment information</Text>

        <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E7ECF3", padding: 20, marginTop: 16, alignItems: "center" }}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="wallet-outline" size={29} color={BLUE} />
          </View>
          <Text style={{ color: TEXT, fontWeight: "900", marginTop: 12 }}>Earnings status</Text>
          <Text style={{ color: MUTED, fontSize: 11, lineHeight: 18, marginTop: 6, textAlign: "center" }}>
            {earnings
              ? `Total: ₹${Number(earnings.total || 0).toLocaleString("en-IN")} · Earned: ₹${Number(earnings.completed || 0).toLocaleString("en-IN")} · Pending: ₹${Number(earnings.pending || 0).toLocaleString("en-IN")}`
              : "Earnings records are not available yet."}
          </Text>
        </View>

        {(earnings?.earnings || []).map((earning: any) => (
          <View key={earning.earningId} style={{ backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E7ECF3", padding: 14, marginTop: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT, fontSize: 13, fontWeight: "900" }}>
                  {earning.appointment?.bookingId || "Collection earning"}
                </Text>
                <Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>
                  {String(earning.status || "PENDING")} · {earning.createdAt ? new Date(earning.createdAt).toLocaleDateString("en-IN") : ""}
                </Text>
              </View>
              <Text style={{ color: BLUE, fontSize: 16, fontWeight: "900" }}>
                ₹{Number(earning.amount || 0).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
