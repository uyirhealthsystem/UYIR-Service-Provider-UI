import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ForgotPassword from "../auth/screens/ForgotPassword";
import Login from "../auth/screens/Login";
import OTP from "../auth/screens/OTP";
import Register from "../auth/screens/Register";
import PendingApproval from "../providers/setup/screens/PendingApproval";
import ProviderType from "../providers/setup/screens/ProviderType";

import AmbulanceRegistration from "../providers/ambulance/features/registration/screens/AmbulanceRegistration";
import ECGRegistration from "../providers/ecg-on-wheels/features/registration/screens/ECGRegistration";
import DoctorRegistration from "../providers/doctor/features/registration/screens/DoctorRegistration";
import LaboratoryRegistration from "../providers/laboratory/features/registration/screens/LaboratoryRegistration";
import ScanCenterRegistration from "../providers/laboratory/features/registration/screens/ScanCenterRegistration";
import HBCProviderRegistration from "../providers/home-based-care/features/registration/screens/HBCProviderRegistration";
import HBCRegistrationType from "../providers/home-based-care/features/registration/screens/HBCRegistrationType";
import HealthPartnerRegistration from "../providers/health-partner/features/registration/screens/HealthPartnerRegistration";
import CollectorRegistration from "../providers/lab-sample-collector/features/registration/screens/CollectorRegistration";
import ProRegistration from "../providers/pro/features/registration";

const Stack = createNativeStackNavigator();

export default function AuthRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="OTP" component={OTP} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ProviderType" component={ProviderType} />
      <Stack.Screen name="PendingApproval" component={PendingApproval} />

      <Stack.Screen name="AmbulanceRegistration" component={AmbulanceRegistration} />
      <Stack.Screen name="ECGRegistration" component={ECGRegistration} />
      <Stack.Screen name="DoctorRegistration" component={DoctorRegistration} />
      <Stack.Screen name="LaboratoryRegistration" component={LaboratoryRegistration} />
      <Stack.Screen name="ScanCenterRegistration" component={ScanCenterRegistration} />
      <Stack.Screen name="HBCRegistrationType" component={HBCRegistrationType} />
      <Stack.Screen name="HBCProviderRegistration" component={HBCProviderRegistration} />
      <Stack.Screen name="HealthPartnerRegistration" component={HealthPartnerRegistration} />
      <Stack.Screen name="CollectorRegistration" component={CollectorRegistration} />
      <Stack.Screen name="ProRegistration" component={ProRegistration} />
    </Stack.Navigator>
  );
}
