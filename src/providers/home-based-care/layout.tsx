import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Home from "./features/home/screens/Home";
import Bookings from "./features/bookings/screens/Bookings";
import Earnings from "./features/earnings/screens/Earnings";
import Profile from "./features/profile/screens/Profile";

const Tab = createBottomTabNavigator();

export default function HomeBasedCareLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#0878F9",
      tabBarInactiveTintColor: "#7B879B",
      tabBarStyle: { height: 63 + insets.bottom, paddingBottom: 7 + insets.bottom, paddingTop: 6, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E9EDF5" },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
    }}>
      <Tab.Screen name="Home" component={Home} options={{ tabBarLabel: "Home", tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} /> }} />
      <Tab.Screen name="Bookings" component={Bookings} options={{ tabBarLabel: "Bookings", tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={20} color={color} /> }} />
      <Tab.Screen name="Earnings" component={Earnings} options={{ tabBarLabel: "Earnings", tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={20} color={color} /> }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: "Profile", tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} /> }} />
    </Tab.Navigator>
  );
}
