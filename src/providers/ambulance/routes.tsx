import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AmbulanceProvider } from "./features/provider-state/store";
import AmbulanceLayout from "./layout";

const Stack = createNativeStackNavigator();

export default function AmbulanceRoutes({
  serviceType = "AMBULANCE",
}: {
  serviceType?: "AMBULANCE" | "AUTO";
}) {
  return (
    <AmbulanceProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AmbulanceLayout">
          {() => <AmbulanceLayout serviceType={serviceType} />}
        </Stack.Screen>
      </Stack.Navigator>
    </AmbulanceProvider>
  );
}
