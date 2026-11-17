import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Dashboard from "./features/dashboard/screens/Dashboard";
import Referrals from "./features/referrals/screens/Referrals";
import Payments from "./features/payments/screens/Payments";
import Profile from "./features/profile/screens/Profile";

const Tab = createBottomTabNavigator();

export default function HealthPartnerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1755E8",
        tabBarInactiveTintColor: "#8B93A7",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 2,
        },
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E8ECF4",
          elevation: 10,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? "home" : "home-outline",
            Referrals: focused ? "people" : "people-outline",
            Payments: focused ? "wallet" : "wallet-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={icons[route.name]} size={21} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Referrals" component={Referrals} />
      <Tab.Screen name="Payments" component={Payments} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
