import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LabSampleCollectorLayout from "./layout";
import BookingDetails from "./features/booking/screens/BookingDetails"; // feature-local booking screen
import Collection from "./features/booking/screens/Collection"; // feature-local collection screen
import Delivery from "./features/booking/screens/Delivery"; // feature-local delivery screen
import { LabSampleCollectorProvider, useLabSampleCollector } from "./features/provider-state/store";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/store";

const Stack = createNativeStackNavigator();

function CollectorGate() {
  const { profile, loading, error, refresh } = useLabSampleCollector();
  const { logout } = useAuth();

  if (loading && !profile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F8FC" }}>
        <ActivityIndicator color="#1473E6" />
        <Text style={{ marginTop: 10, color: "#758096" }}>Checking collector approval…</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F8FC", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#172033", textAlign: "center" }}>Unable to load collector profile</Text>
        <Text style={{ marginTop: 8, color: "#758096", textAlign: "center", lineHeight: 20 }}>{error}</Text>
        <Pressable onPress={() => refresh()} style={{ marginTop: 18, backgroundColor: "#1473E6", borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Retry</Text>
        </Pressable>
        <Pressable onPress={logout} style={{ marginTop: 10, borderWidth: 1, borderColor: "#1473E6", borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ color: "#1473E6", fontWeight: "900" }}>Log out</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (profile && (profile.status !== "ACTIVE" || profile.qualificationStatus !== "VERIFIED")) {
    const rejected = profile.status === "INACTIVE" || profile.qualificationStatus === "REJECTED";
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F8FC", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E5EBF3", padding: 22, alignItems: "center" }}>
          <Text style={{ fontSize: 48 }}>{rejected ? "!" : "⌛"}</Text>
          <Text style={{ marginTop: 12, fontSize: 21, fontWeight: "900", color: "#172033", textAlign: "center" }}>
            {rejected ? "Collector registration not approved" : "Collector approval pending"}
          </Text>
          <Text style={{ marginTop: 9, color: "#758096", lineHeight: 20, textAlign: "center" }}>
            {profile.qualificationStatus === "REJECTED"
              ? "Your qualification was rejected. Review the registration requirements or contact administrator support."
              : profile.qualificationStatus === "PENDING"
                ? "Your qualification is awaiting verification. The account becomes usable after administrator approval."
                : "Your collector account is inactive. Contact administrator support."}
          </Text>
          <Text style={{ marginTop: 12, color: "#1473E6", fontWeight: "800", fontSize: 12 }}>
            Qualification: {profile.qualificationStatus} · Account: {profile.status}
          </Text>
        </View>
        <Pressable onPress={() => refresh()} style={{ marginTop: 18, backgroundColor: "#1473E6", borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Check again</Text>
        </Pressable>
        <Pressable onPress={logout} style={{ marginTop: 10, borderWidth: 1, borderColor: "#1473E6", borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ color: "#1473E6", fontWeight: "900" }}>Log out</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LabCollectorLayout" component={LabSampleCollectorLayout} />
      <Stack.Screen name="LabCollectorBookingDetails" component={BookingDetails} />
      <Stack.Screen name="LabCollectorCollection" component={Collection} />
      <Stack.Screen name="LabCollectorDelivery" component={Delivery} />
    </Stack.Navigator>
  );
}

export default function LabSampleCollectorRoutes() {
  return <LabSampleCollectorProvider>
    <CollectorGate />
  </LabSampleCollectorProvider>;
}
