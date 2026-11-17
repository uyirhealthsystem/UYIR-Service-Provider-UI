// Hospital provider layout: bottom tabs for the four daily-use areas.
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HospitalHome from "./features/home/screens/HospitalHome";
import HospitalAppointments from "./features/appointments/screens/HospitalAppointments";
import HospitalDoctors from "./features/doctors/screens/HospitalDoctors";
import HospitalEmergencies from "./features/emergencies/screens/HospitalEmergencies";
import HospitalMore from "./features/more/screens/HospitalMore";
import { useHospitalStore } from "./features/provider-state/store";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, [any, any]> = {
  HospitalHome: ["home-outline", "home"],
  HospitalAppointments: ["calendar-outline", "calendar"],
  HospitalDoctors: ["people-outline", "people"],
  HospitalEmergencies: ["alert-circle-outline", "alert-circle"],
  HospitalMore: ["grid-outline", "grid"],
};

export default function HospitalLayout() {
  const insets = useSafeAreaInsets();
  const { emergencyQueue } = useHospitalStore();
  return (
    <Tab.Navigator
      initialRouteName="HospitalHome"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0B63CE",
        tabBarInactiveTintColor: "#7B8798",
        tabBarHideOnKeyboard: true,
        tabBarStyle: { height: 58 + insets.bottom, paddingBottom: 6 + insets.bottom, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "700" },
        tabBarIcon: ({ color, size, focused }) => <Ionicons name={ICONS[route.name][focused ? 1 : 0]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="HospitalHome" component={HospitalHome} options={{ title: "Home" }} />
      <Tab.Screen name="HospitalAppointments" component={HospitalAppointments} options={{ title: "Appointments" }} />
      <Tab.Screen name="HospitalDoctors" component={HospitalDoctors} options={{ title: "Doctors" }} />
      <Tab.Screen
        name="HospitalEmergencies" component={HospitalEmergencies}
        options={{ title: "Emergency", tabBarBadge: emergencyQueue.length || undefined, tabBarBadgeStyle: { backgroundColor: "#D1304A" } }}
      />
      <Tab.Screen name="HospitalMore" component={HospitalMore} options={{ title: "More" }} />
    </Tab.Navigator>
  );
}
