import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TeleconsultationLayout from "./layout";
import AppointmentDetailsScreen from "./features/appointments/screens/AppointmentDetailsScreen";
import ConsultationRoomScreen from "./features/consultation/screens/ConsultationRoomScreen";
import ConsultationNotesScreen from "./features/consultation/screens/ConsultationNotesScreen";
import PrescriptionsScreen from "./features/prescriptions/screens/PrescriptionsScreen";
import FeedbackScreen from "./features/feedback/screens/FeedbackScreen";
import ComplaintsScreen from "./features/complaints/screens/ComplaintsScreen";
import AddComplaintScreen from "./features/complaints/screens/AddComplaintScreen";

const Stack = createNativeStackNavigator();

export default function TeleconsultationRoutes() {
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TeleconsultationLayout" component={TeleconsultationLayout} />
    <Stack.Screen name="TCAppointmentDetails" component={AppointmentDetailsScreen} />
    <Stack.Screen name="TCConsultationRoom" component={ConsultationRoomScreen} />
    <Stack.Screen name="TCConsultationNotes" component={ConsultationNotesScreen} />
    <Stack.Screen name="TCPrescriptions" component={PrescriptionsScreen} />
    <Stack.Screen name="TCFeedback" component={FeedbackScreen} />
    <Stack.Screen name="TCComplaints" component={ComplaintsScreen} />
    <Stack.Screen name="TCAddComplaint" component={AddComplaintScreen} />
  </Stack.Navigator>;
}
