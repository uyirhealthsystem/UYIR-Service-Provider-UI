import { ActivityIndicator, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HospitalLayout from "./layout";
import HospitalDoctorForm from "./features/doctors/screens/HospitalDoctorForm";
import HospitalDoctorDashboard from "./features/doctors/screens/HospitalDoctorDashboard";
import HospitalSlots from "./features/slots/screens/HospitalSlots";
import HospitalAssign from "./features/assignments/screens/HospitalAssign";
import HospitalSchedule from "./features/schedules/screens/HospitalSchedule";
import HospitalDoctorPatients from "./features/appointments/screens/HospitalDoctorPatients";
import HospitalAppointmentDetail from "./features/appointments/screens/HospitalAppointmentDetail";
import HospitalMarkComplete from "./features/appointments/screens/HospitalMarkComplete";
import HospitalProfile from "./features/profile/screens/HospitalProfile";
import HospitalProfileForm from "./features/profile/screens/HospitalProfileForm";
import HospitalReports from "./features/reports/screens/HospitalReports";
import HospitalInvoices from "./features/billing/screens/HospitalInvoices";
import HospitalInvoiceDetail from "./features/billing/screens/HospitalInvoiceDetail";
import HospitalPayoutAccount from "./features/billing/screens/HospitalPayoutAccount";
import HospitalIncomingAmbulance from "./features/emergencies/screens/HospitalIncomingAmbulance";
import EmergencyAlertModal from "./components/EmergencyAlertModal";
import ClaimHospital from "./features/claim/screens/ClaimHospital";
import { Banner, Button, C } from "./components/ui";
import { HospitalProvider, useHospitalStore } from "./features/provider-state/store";
import { useAuth } from "../../auth/store";

const Stack = createNativeStackNavigator();

/** GET /me decides the flow: no hospital yet (404) → registration wizard, otherwise the portal. */
function HospitalGate() {
  const { profileStatus, refreshHospital } = useHospitalStore();
  const { logout } = useAuth();

  if (profileStatus === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ marginTop: 12, color: C.muted }}>Loading your hospital…</Text>
      </View>
    );
  }
  if (profileStatus === "error") {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: C.bg }}>
        <Banner tone="danger" text="We couldn't reach the hospital service. Check your connection and try again." />
        <Button title="Retry" icon="refresh" onPress={refreshHospital} />
        <Button title="Log out" variant="ghost" onPress={logout} style={{ marginTop: 10 }} />
      </View>
    );
  }
  if (profileStatus === "missing") {
    // GET /me → 404: this login has no hospital yet. A PRO onboards hospitals and the hospital service
    // emails the hospital its ID + claim code; linking here makes GET /me return it.
    return <ClaimHospital onClaimed={refreshHospital} onLogout={logout} />;
  }
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="HospitalTabs">
        <Stack.Screen name="HospitalTabs" component={HospitalLayout} />
        <Stack.Screen name="HospitalDoctorForm" component={HospitalDoctorForm} />
        <Stack.Screen name="HospitalDoctorDashboard" component={HospitalDoctorDashboard} />
        <Stack.Screen name="HospitalSlots" component={HospitalSlots} />
        <Stack.Screen name="HospitalAssign" component={HospitalAssign} />
        <Stack.Screen name="HospitalSchedule" component={HospitalSchedule} />
        <Stack.Screen name="HospitalDoctorPatients" component={HospitalDoctorPatients} />
        <Stack.Screen name="HospitalAppointmentDetail" component={HospitalAppointmentDetail} />
        <Stack.Screen name="HospitalMarkComplete" component={HospitalMarkComplete} />
        <Stack.Screen name="HospitalProfile" component={HospitalProfile} />
        <Stack.Screen name="HospitalProfileForm" component={HospitalProfileForm} />
        <Stack.Screen name="HospitalReports" component={HospitalReports} />
        <Stack.Screen name="HospitalInvoices" component={HospitalInvoices} />
        <Stack.Screen name="HospitalInvoiceDetail" component={HospitalInvoiceDetail} />
        <Stack.Screen name="HospitalPayoutAccount" component={HospitalPayoutAccount} />
        <Stack.Screen name="HospitalIncomingAmbulance" component={HospitalIncomingAmbulance} />
      </Stack.Navigator>
      {/* Sits above every screen. Cannot be dismissed: the nurse must accept or decline. */}
      <EmergencyAlertModal />
    </>
  );
}

export default function HospitalRoutes() {
  return (
    <HospitalProvider>
      <HospitalGate />
    </HospitalProvider>
  );
}
