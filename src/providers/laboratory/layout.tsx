import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Home from "./features/home/screens/Home";
import Appointments from "./features/appointments/screens/Appointments";
import Slots from "./features/slots/screens/Slots";
import Reports from "./features/reports/screens/Reports";
import Profile from "./features/profile/screens/Profile";
const Tab = createBottomTabNavigator();
const iconMap: Record<string, any> = { Home: "home-outline", Appointments: "calendar-outline", Slots: "time-outline", Reports: "document-text-outline", Profile: "person-outline" };
export default function LaboratoryLayout() { const insets = useSafeAreaInsets(); return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: "#173FD1", tabBarInactiveTintColor: "#7B8190", tabBarStyle: { height: 68 + insets.bottom, paddingBottom: 8 + insets.bottom, paddingTop: 5, borderTopWidth: 1, borderTopColor: "#E9EDF3", backgroundColor: "#fff" }, tabBarLabelStyle: { fontSize: 9.5, fontWeight: "600" }, tabBarIcon: ({ color, size }) => <Ionicons name={iconMap[route.name]} size={size} color={color} /> })}><Tab.Screen name="Home" component={Home} /><Tab.Screen name="Appointments" component={Appointments} /><Tab.Screen name="Slots" component={Slots} /><Tab.Screen name="Reports" component={Reports} /><Tab.Screen name="Profile" component={Profile} /></Tab.Navigator>; }
