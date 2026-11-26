import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Home from "./features/home/screens/Home";
import Bookings from "./features/bookings/screens/Bookings";
import Profile from "./features/profile/screens/Profile";
import Reports from "./features/reports/screens/Reports";
import Earnings from "./features/earnings/screens/Earnings";

const Tab = createBottomTabNavigator();
const icons: Record<string, any> = { Home: "home-outline", Bookings: "calendar-outline", Reports: "document-text-outline", Earnings: "wallet-outline", Profile: "person-outline" };

export default function LabSampleCollectorLayout() {
  const insets = useSafeAreaInsets();
  return <Tab.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: "#1473E6",
    tabBarInactiveTintColor: "#7B8798",
    tabBarStyle: { height: 68 + insets.bottom, paddingBottom: 8 + insets.bottom, paddingTop: 5, borderTopWidth: 1, borderTopColor: "#E5EBF3", backgroundColor: "#FFFFFF" },
    tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
    tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
  })}>
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Bookings" component={Bookings} />
    <Tab.Screen name="Reports" component={Reports} />
    <Tab.Screen name="Earnings" component={Earnings} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>;
}
