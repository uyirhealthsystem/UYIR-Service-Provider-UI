import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LaboratoryLayout from "./layout";
import AppointmentDetails from "./features/appointments/screens/AppointmentDetails";
import CompleteTest from "./features/appointments/screens/CompleteTest";
import CancelReschedule from "./features/appointments/screens/CancelReschedule";
import UploadReport from "./features/reports/screens/UploadReport";
import HomeCollectionDetails from "./features/home-collection/screens/HomeCollectionDetails";
import Earnings from "./features/earnings/screens/Earnings";
import TestCatalog from "./features/catalog/screens/TestCatalog";
import LabTests from "./features/lab-tests/screens/LabTests";
import ScanServices from "./features/scan-services/screens/ScanServices";
import Equipment from "./features/equipment/screens/Equipment";
const Stack = createNativeStackNavigator();
export default function LaboratoryRoutes() { return <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="LaboratoryLayout" component={LaboratoryLayout} /><Stack.Screen name="LabAppointmentDetails" component={AppointmentDetails} /><Stack.Screen name="LabCompleteTest" component={CompleteTest} /><Stack.Screen name="LabCancelReschedule" component={CancelReschedule} /><Stack.Screen name="LabUploadReport" component={UploadReport} /><Stack.Screen name="LabHomeCollectionDetails" component={HomeCollectionDetails} /><Stack.Screen name="LabEarnings" component={Earnings} /><Stack.Screen name="LabTestCatalog" component={TestCatalog} /><Stack.Screen name="LabTests" component={LabTests} /><Stack.Screen name="ScanServices" component={ScanServices} /><Stack.Screen name="Equipment" component={Equipment} /></Stack.Navigator>; }
