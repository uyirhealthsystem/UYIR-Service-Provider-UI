import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "./features/home/screens/Home";
import Bookings from "./features/bookings/screens/Bookings";
import Reports from "./features/reports/screens/Reports";
import Profile from "./features/profile/screens/Profile";

const Tab = createBottomTabNavigator();
const iconMap: Record<string, any> = { Home: "home-outline", Bookings: "calendar-outline", Reports: "document-text-outline", Profile: "person-outline" };

export default function ECGLayout() {
  return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: "#1473E6", tabBarInactiveTintColor: "#7B8798", tabBarStyle: { height: 68, paddingBottom: 8, paddingTop: 5, borderTopWidth: 1, borderTopColor: "#E5EBF3", backgroundColor: "#FFFFFF" }, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" }, tabBarIcon: ({ color, size }) => <Ionicons name={iconMap[route.name]} size={size} color={color} /> })}>
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Bookings" component={Bookings} />
    <Tab.Screen name="Reports" component={Reports} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>;
}
