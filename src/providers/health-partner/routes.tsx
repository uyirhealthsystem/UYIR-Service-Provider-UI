import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ReferCitizen from "./features/dashboard/screens/ReferCitizen";
import ReferHealthPartner from "./features/dashboard/screens/ReferHealthPartner";
import ReferHub from "./features/dashboard/screens/ReferHub";
import BankDetails from "./features/payments/screens/BankDetails";
import PaymentIssue from "./features/payments/screens/PaymentIssue";
import EditProfile from "./features/profile/screens/EditProfile";
import ReferralDetails from "./features/referrals/screens/ReferralDetails";
import HealthPartnerLayout from "./layout";

const Stack = createNativeStackNavigator();

export default function HealthPartnerRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="HealthPartnerLayout"
        component={HealthPartnerLayout}
      />
      <Stack.Screen name="ReferHub" component={ReferHub} />
      <Stack.Screen name="ReferCitizen" component={ReferCitizen} />
      <Stack.Screen name="ReferHealthPartner" component={ReferHealthPartner} />
      <Stack.Screen name="ReferralDetails" component={ReferralDetails} />
      <Stack.Screen name="PaymentIssue" component={PaymentIssue} />
      <Stack.Screen name="BankDetails" component={BankDetails} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
}
