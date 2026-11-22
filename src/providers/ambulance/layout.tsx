import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Bookings from "./features/bookings/screens/Bookings";
import Earnings from "./features/earnings/screens/Earnings";
import Home from "./features/home/screens/Home";
import Profile from "./features/profile/screens/Profile";
import { colors } from "./theme";
import type { ServiceType } from "./types";
import type { IconName } from "./ui/components";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Home: { active: "map", inactive: "map-outline" },
  Bookings: { active: "document-text", inactive: "document-text-outline" },
  Earnings: { active: "wallet", inactive: "wallet-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

export default function AmbulanceLayout({ serviceType }: { serviceType: ServiceType }) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          backgroundColor: colors.surface,
        },
        tabBarItemStyle: { flex: 1, minWidth: 0 },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} initialParams={{ serviceType }} />
      <Tab.Screen name="Bookings" component={Bookings} options={{ title: "Trips" }} />
      <Tab.Screen name="Earnings" component={Earnings} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
