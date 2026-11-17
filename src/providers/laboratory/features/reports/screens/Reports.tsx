import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProviderAppointments } from "../../../api/laboratory";
import ReportCard from "../components/ReportCard";


type Appointment = {
  [key: string]: any;
  appointmentId: string;
  bookingId?: string;
  patientId?: string;
  labId?: string | null;
  scanCenterId?: string | null;
  appointmentType: string;
  appointmentMode: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  address?: string | null;
  status: string;
  patientNotes?: string | null;
  patient?: { patientId?: string; name?: string; gender?: string; age?: number; phone?: string } | null;
  lab?: { labId?: string; labUserId?: string; name?: string; registrationNumber?: string; phone?: string; email?: string; address?: string; districtId?: string } | null;
  scanCenter?: { scanCenterId?: string; scanCenterUserId?: string; name?: string; registrationNumber?: string; phone?: string; email?: string; address?: string; districtId?: string } | null;
  tests?: Array<{ appointmentTestId?: string; labTestId?: string; price?: string | number | null; status?: string; labTest?: any }>;
  services?: Array<{ appointmentServiceId?: string; scanServiceId?: string; equipmentId?: string; price?: string | number | null; status?: string; scanService?: any; equipment?: any }>;
  homeCollection?: any;
  cancellation?: any;
  reschedules?: any[];
  report?: any;
  earning?: any;
};

function appointmentMatchesProvider(appointment: Appointment, labId?: string, scanCenterId?: string) {
  const appointmentLabId = appointment.labId || appointment.lab?.labId || null;
  const appointmentScanCenterId = appointment.scanCenterId || appointment.scanCenter?.scanCenterId || null;
  return Boolean((labId && appointmentLabId === labId) || (scanCenterId && appointmentScanCenterId === scanCenterId));
}


export default function Reports({ navigation }: any) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try { const { context, response } = await getProviderAppointments(); const data = Array.isArray(response?.data) ? response.data : []; setAppointments(data.filter((item: Appointment) => appointmentMatchesProvider(item, context.lab?.labId, context.scanCenter?.scanCenterId))); }
    catch (error) { console.log("Reports API error:", error); }
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  const list = appointments.filter((item) => tab === "Pending" ? !item.report && item.status !== "CANCELLED" : Boolean(item.report));
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8FC" }}><View style={{ padding: 16 }}><Text style={{ fontSize: 22, fontWeight: "900", color: "#172033" }}>Reports</Text><View style={{ flexDirection: "row", marginTop: 14, backgroundColor: "#E9EDF5", borderRadius: 10, padding: 3 }}>{["Pending", "Sent"].map((x) => <View key={x} style={{ flex: 1 }}>{tab === x ? <Text onPress={() => setTab(x)} style={{ textAlign: "center", backgroundColor: "#173FD1", color: "#fff", borderRadius: 8, paddingVertical: 9, fontSize: 11, fontWeight: "800" }}>{x}</Text> : <Text onPress={() => setTab(x)} style={{ textAlign: "center", paddingVertical: 9, color: "#687386", fontSize: 11, fontWeight: "800" }}>{x}</Text>}</View>)}</View></View><ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>{loading ? <Text style={{ color: "#758096" }}>Loading reports...</Text> : list.length ? list.map((item) => <ReportCard key={item.appointmentId} appointment={item} navigation={navigation} />) : <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18 }}><Text style={{ color: "#758096", fontSize: 12 }}>No {tab.toLowerCase()} reports.</Text></View>}</ScrollView></SafeAreaView>;
}
