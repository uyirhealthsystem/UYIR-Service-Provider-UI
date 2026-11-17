import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/store";

import AmbulanceRoutes from "../providers/ambulance/routes";
import ECGOnWheelsRoutes from "../providers/ecg-on-wheels/routes";
import HealthPartnerRoutes from "../providers/health-partner/routes";
import HomeBasedCareRoutes from "../providers/home-based-care/routes";
import HospitalRoutes from "../providers/hospital/routes";
import LabCollectorRoutes from "../providers/lab-sample-collector/routes";
import LaboratoryRoutes from "../providers/laboratory/routes";
import ProRoutes from "../providers/pro/routes";
import TeleconsultationRoutes from "../providers/teleconsultation/routes";

import { ProProvider } from "../providers/pro/features/provider-state/store";

const Stack = createNativeStackNavigator();

export default function ProviderRoutes() {
  const { user } = useAuth();

  const providerType = String(
    user?.providerType || user?.role || "",
  ).toUpperCase();

  console.log("Logged in provider role:", providerType);

  const renderProviderRoutes = () => {
    switch (providerType) {
      case "TCS":
      case "TELECONSULTATION":
      case "TELECONSULTATION_DOCTOR":
      case "TELECONSULT":
      case "TC":
        return <TeleconsultationRoutes />;

      case "LS":
        // Laboratory
        return <LaboratoryRoutes />;

      case "AMBULANCE_DRIVER":
      case "AMBULANCE":
        // Ambulance driver
        return <AmbulanceRoutes serviceType="AMBULANCE" />;

      case "AUTO_DRIVER":
      case "AUTO":
        // Auto provider
        return <AmbulanceRoutes serviceType="AUTO" />;

      case "LSC":
        // Lab sample collector
        return <LabCollectorRoutes />;

      case "ECG":
      case "ECG_ON_WHEELS":
      case "ECG_ON_WHEEL":
        // ECG on Wheels
        return <ECGOnWheelsRoutes />;

      case "HP":
        // Health Partner
        return <HealthPartnerRoutes />;

      case "HBC":
        // Home Based Care
        return <HomeBasedCareRoutes />;

      case "HOSPITAL":
        return <HospitalRoutes />;

      case "PRO":
      case "DOCTOR":
      default:
        // PRO provider
        return <ProRoutes />;
    }
  };

  return (
    <ProProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Provider" children={renderProviderRoutes} />
      </Stack.Navigator>
    </ProProvider>
  );
}
