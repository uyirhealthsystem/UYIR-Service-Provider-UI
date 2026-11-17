import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ECGLayout from "./layout";
import BookingDetails from "./features/booking/screens/BookingDetails";
import { ECGProvider } from "./features/provider-state/store";

const Stack = createNativeStackNavigator();

export default function ECGOnWheelsRoutes() {
  return <ECGProvider><Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ECGLayout" component={ECGLayout} />
    <Stack.Screen name="ECGBookingDetails" component={BookingDetails} />
  </Stack.Navigator></ECGProvider>;
}
