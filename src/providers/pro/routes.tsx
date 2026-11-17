import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Dashboard from "./features/dashboard/screens/Dashboard";

import Onboarded from "./features/onboarded-providers/screens/Onboarded";

import TodayProgress from "./features/dashboard/screens/TodayProgress";
import Notifications from "./features/notifications/screens/Notifications";
import ProviderDetails from "./features/onboarded-providers/screens/ProviderDetails";
import HospitalOnboardingForm from "./features/onboarding/components/HospitalOnboardingForm";
import OnboardingApproval from "./features/onboarding/components/OnboardingApproval";
import OnboardingPreview from "./features/onboarding/components/OnboardingPreview";
import HospitalVisit from "./features/onboarding/screens/HospitalVisit";
import Rewards from "./features/rewards/screens/Rewards";
import ProLayout from "./layout";
const Stack = createNativeStackNavigator();

export default function ProRoutes() {
  return (
    <Stack.Navigator id="ProStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProLayout" component={ProLayout} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="HospitalVisit" component={HospitalVisit} />
      <Stack.Screen name="OnboardingPreview" component={OnboardingPreview} />
      <Stack.Screen
        name="HospitalOnboarding"
        component={HospitalOnboardingForm}
      />
      <Stack.Screen name="OnboardingApproval" component={OnboardingApproval} />
      <Stack.Screen name="TodayProgress" component={TodayProgress} />
      <Stack.Screen name="Onboarded" component={Onboarded} />
      <Stack.Screen name="Rewards" component={Rewards} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="ProviderDetails" component={ProviderDetails} />
    </Stack.Navigator>
  );
}
