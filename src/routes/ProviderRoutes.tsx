import React, { lazy, Suspense } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/store";
import { ProProvider } from "../providers/pro/features/provider-state/store";

const AmbulanceRoutes = lazy(() => import("../providers/ambulance/routes"));
const ECGOnWheelsRoutes = lazy(() => import("../providers/ecg-on-wheels/routes"));
const HealthPartnerRoutes = lazy(() => import("../providers/health-partner/routes"));
const HomeBasedCareRoutes = lazy(() => import("../providers/home-based-care/routes"));
const HospitalRoutes = lazy(() => import("../providers/hospital/routes"));
const LabCollectorRoutes = lazy(() => import("../providers/lab-sample-collector/routes"));
const LaboratoryRoutes = lazy(() => import("../providers/laboratory/routes"));
const ProRoutes = lazy(() => import("../providers/pro/routes"));
const TeleconsultationRoutes = lazy(() => import("../providers/teleconsultation/routes"));

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

  const LazyRoutes = (
    <Suspense
      fallback={
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Loading provider workspace…</Text>
        </View>
      }
    >
      {renderProviderRoutes()}
    </Suspense>
  );

  return (
    <ProProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Provider">{() => LazyRoutes}</Stack.Screen>
      </Stack.Navigator>
    </ProProvider>
  );
}
