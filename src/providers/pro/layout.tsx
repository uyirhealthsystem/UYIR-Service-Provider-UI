import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Bucket from "./features/bucket/screens/Bucket";
import Dashboard from "./features/dashboard/screens/Dashboard";
import Hospitals from "./features/hospitals/screens/Hospitals";
import Onboarded from "./features/onboarded-providers/screens/Onboarded";
import Profile from "./features/profile/screens/Profile";

const Tab = createBottomTabNavigator();

export default function ProLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#173FD1",
        tabBarInactiveTintColor: "#7B8190",
        tabBarStyle: {
          height: 65 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E9EDF3",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Dashboard}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Hospitals"
        component={Hospitals}
        options={{
          tabBarLabel: "Hospitals",
          tabBarIcon: ({ color }) => (
            <Ionicons name="business-outline" size={20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Bucket"
        component={Bucket}
        options={{
          tabBarLabel: "Bucket",
          tabBarIcon: ({ color }) => (
            <Ionicons name="layers-outline" size={20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Onboarded"
        component={Onboarded}
        options={{
          tabBarLabel: "Onboarded",
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-circle-outline" size={20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
