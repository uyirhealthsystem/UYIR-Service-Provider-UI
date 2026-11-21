import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLabSampleCollector } from "../../provider-state/store";

const BG = "#F5F8FC";
const BLUE = "#1473E6";
const MUTED = "#758096";
const TEXT = "#172033";

export default function Reports({ navigation }: any) {
  const { history, loading, refresh } = useLabSampleCollector();

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
          <Text style={{ color: TEXT, fontSize: 23, fontWeight: "900", flex: 1, marginRight: 36, textAlign: "center" }}>Reports</Text>
        </View>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>
          Reports associated with completed sample collections
        </Text>

        {history.length === 0 ? (
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 30, marginTop: 16, alignItems: "center" }}>
            <Ionicons name="document-text-outline" size={40} color={MUTED} />
            <Text style={{ color: TEXT, fontWeight: "900", marginTop: 10 }}>No reports yet</Text>
            <Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4, textAlign: "center" }}>
              Completed collection reports will appear here.
            </Text>
          </View>
        ) : history.map((booking) => (
          <View key={booking.id} style={{ backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: "#E7ECF3", padding: 14, marginTop: 10 }}>
            <Text style={{ color: TEXT, fontSize: 14, fontWeight: "900" }}>{booking.patient}</Text>
            <Text style={{ color: MUTED, fontSize: 10.5, marginTop: 4 }}>
              {booking.tests.map((test) => test.name).join(" • ") || "Laboratory tests"}
            </Text>
            <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name={booking.reportStatus && ["UPLOADED", "SENT", "COMPLETED"].includes(booking.reportStatus.toUpperCase()) ? "checkmark-circle" : "document-outline"}
                size={18}
                color={BLUE}
              />
              <Text style={{ marginLeft: 7, flex: 1, color: MUTED, fontSize: 11 }}>
                {booking.reportStatus ? `Report status: ${booking.reportStatus}` : "Report status unavailable"}
              </Text>
            </View>
            {booking.reportUrl ? (
              <Pressable onPress={() => Linking.openURL(booking.reportUrl!)} style={{ marginTop: 12, backgroundColor: BLUE, borderRadius: 10, padding: 11, alignItems: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>Open report</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
