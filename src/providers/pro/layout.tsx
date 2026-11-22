import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { ComponentProps } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Bucket from "./features/bucket/screens/Bucket";
import Dashboard from "./features/dashboard/screens/Dashboard";
import Hospitals from "./features/hospitals/screens/Hospitals";
import Onboarded from "./features/onboarded-providers/screens/Onboarded";
import Profile from "./features/profile/screens/Profile";
import { colors, shadow } from "./theme";

const Tab = createBottomTabNavigator();

type IconName = ComponentProps<typeof Ionicons>["name"];

const TABS: { name: string; label: string; component: any; icon: IconName; activeIcon: IconName }[] = [
  { name: "Home", label: "Home", component: Dashboard, icon: "home-outline", activeIcon: "home" },
  { name: "Hospitals", label: "Find", component: Hospitals, icon: "search-outline", activeIcon: "search" },
  { name: "Bucket", label: "Bucket", component: Bucket, icon: "briefcase-outline", activeIcon: "briefcase" },
  { name: "Onboarded", label: "Onboarded", component: Onboarded, icon: "ribbon-outline", activeIcon: "ribbon" },
  { name: "Profile", label: "Profile", component: Profile, icon: "person-outline", activeIcon: "person" },
];

export default function ProLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          height: 66 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          ...shadow.floating,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused ? colors.brandSoft : "transparent",
                }}
              >
                <Ionicons name={focused ? tab.activeIcon : tab.icon} size={20} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
