import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AmbulanceLayout from "./layout";
import type { ServiceType } from "./types";

const Stack = createNativeStackNavigator();

export default function AmbulanceRoutes({
  serviceType = "AMBULANCE",
}: {
  serviceType?: ServiceType;
}) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AmbulanceLayout">
        {() => <AmbulanceLayout serviceType={serviceType} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
