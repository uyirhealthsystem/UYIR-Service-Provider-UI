import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Dashboard from "./features/dashboard/screens/Dashboard";
import AppointmentsScreen from "./features/appointments/screens/AppointmentsScreen";
import ScheduleScreen from "./features/schedule/screens/ScheduleScreen";
import EarningsScreen from "./features/earnings/screens/EarningsScreen";
import ProfileScreen from "./features/profile/screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function TeleconsultationLayout() {
  const insets = useSafeAreaInsets();
  return <Tab.Navigator screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: "#1264E8",
    tabBarInactiveTintColor: "#8994A5",
    tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
    tabBarStyle: { height: 62 + insets.bottom, paddingTop: 8, paddingBottom: 5 + insets.bottom, backgroundColor: "#FFFFFF", borderTopColor: "#E8EDF5", borderTopWidth: 1 },
  }}>
    <Tab.Screen name="Home" component={Dashboard} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
    <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} /> }} />
    <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
  </Tab.Navigator>;
}
