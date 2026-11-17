import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/store";
import { Button, C, ErrorBanner } from "./components/ui";
import BookingDetails from "./features/booking/screens/BookingDetails";
import Map from "./features/booking/screens/Map";
import EditProfile from "./features/profile/screens/EditProfile";
import { HbcProvider, useHbcStore } from "./features/provider-state/store";
import HBCProviderRegistration from "./features/registration/screens/HBCProviderRegistration";
import HBCRegistrationType from "./features/registration/screens/HBCRegistrationType";
import Services from "./features/services/screens/Services";
import HomeBasedCareLayout from "./layout";

const Stack = createNativeStackNavigator();

function HbcStack() {
  const { profile, loading, error, notRegistered, refresh } = useHbcStore();
  const { logout } = useAuth();

  if (!profile && loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator color={C.blue} size="large" />
      </View>
    );
  }

  // Logged in as HBC but no provider profile yet: register before anything else.
  if (notRegistered) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HBCRegistrationType" component={HBCRegistrationType} />
        <Stack.Screen name="HBCProviderRegistration" component={HBCProviderRegistration} />
      </Stack.Navigator>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, padding: 20, justifyContent: "center" }}>
        <Text style={{ color: C.ink, fontSize: 20, fontWeight: "900", marginBottom: 12 }}>Couldn't load your profile</Text>
        <ErrorBanner message={error || "Unknown error"} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button title="Log out" variant="outline" onPress={logout} />
          <Button title="Retry" onPress={refresh} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeCareLayout" component={HomeBasedCareLayout} />
      <Stack.Screen name="HomeCareBookingDetails" component={BookingDetails} />
      <Stack.Screen name="HomeCareMap" component={Map} />
      <Stack.Screen name="HomeCareEditProfile" component={EditProfile} />
      <Stack.Screen name="HomeCareServices" component={Services} />
    </Stack.Navigator>
  );
}

export default function HomeBasedCareRoutes() {
  return (
    <HbcProvider>
      <HbcStack />
    </HbcProvider>
  );
}
