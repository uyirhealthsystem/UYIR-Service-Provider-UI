import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Home from "./features/home/screens/Home";
import Bookings from "./features/bookings/screens/Bookings";
import Earnings from "./features/earnings/screens/Earnings";
import Profile from "./features/profile/screens/Profile";

const Tab = createBottomTabNavigator();

type Props = {
  serviceType: "AMBULANCE" | "AUTO";
};

export default function AmbulanceLayout({ serviceType }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1473E6",
        tabBarInactiveTintColor: "#7B8798",
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: 5 + insets.bottom,
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: "#E5EBF3",
          backgroundColor: "#FFFFFF",
        },
        tabBarItemStyle: { flex: 1, minWidth: 0 },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, any> = {
            Home: "home-outline",
            Bookings: "calendar-outline",
            Earnings: "wallet-outline",
            Profile: "person-outline",
          };

          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        initialParams={{ serviceType }}
      />
      <Tab.Screen
        name="Bookings"
        component={Bookings}
        initialParams={{ serviceType }}
      />
      <Tab.Screen
        name="Earnings"
        component={Earnings}
        initialParams={{ serviceType }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        initialParams={{ serviceType }}
      />
    </Tab.Navigator>
  );
}
