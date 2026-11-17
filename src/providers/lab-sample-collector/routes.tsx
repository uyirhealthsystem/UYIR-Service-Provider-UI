import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LabSampleCollectorLayout from "./layout";
import BookingDetails from "./features/booking/screens/BookingDetails"; // feature-local booking screen
import Collection from "./features/booking/screens/Collection"; // feature-local collection screen
import Delivery from "./features/booking/screens/Delivery"; // feature-local delivery screen
import { LabSampleCollectorProvider } from "./features/provider-state/store";

const Stack = createNativeStackNavigator();

export default function LabSampleCollectorRoutes() {
  return <LabSampleCollectorProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LabCollectorLayout" component={LabSampleCollectorLayout} />
      <Stack.Screen name="LabCollectorBookingDetails" component={BookingDetails} />
      <Stack.Screen name="LabCollectorCollection" component={Collection} />
      <Stack.Screen name="LabCollectorDelivery" component={Delivery} />
    </Stack.Navigator>
  </LabSampleCollectorProvider>;
}
