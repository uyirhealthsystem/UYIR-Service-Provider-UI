import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProviderAppointments } from "../../../api/laboratory";
import EarningsSummary from "../components/EarningsSummary";
import RecentEarnings from "../components/RecentEarnings";


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

function appointmentValue(appointment: Appointment) {
  const testTotal = (appointment.tests || []).reduce((sum, item) => {
    const value = Number(item.price ?? item.labTest?.price ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const serviceTotal = (appointment.services || []).reduce((sum, item) => {
    const value = Number(item.price ?? item.scanService?.price ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  return testTotal + serviceTotal;
}

export default function Earnings({ navigation }: any) { const [appointments, setAppointments] = useState<Appointment[]>([]); const load = async () => { try { const { context, response } = await getProviderAppointments(); const data = Array.isArray(response?.data) ? response.data : []; setAppointments(data.filter((x: Appointment) => appointmentMatchesProvider(x, context.lab?.labId, context.scanCenter?.scanCenterId))); } catch (e) { console.log("Earnings API error:", e); } }; useFocusEffect(useCallback(() => { load(); }, [])); const total = appointments.reduce((sum, x) => sum + appointmentValue(x), 0); const sent = appointments.filter((x) => Boolean(x.report)).length; return <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8FC" }}><View style={{ flexDirection: "row", alignItems: "center", padding: 18 }}><Pressable onPress={() => navigation.goBack()}><Text style={{ fontSize: 28 }}>‹</Text></Pressable><Text style={{ flex: 1, textAlign: "center", marginRight: 28, fontSize: 18, fontWeight: "800" }}>Earnings</Text></View><ScrollView contentContainerStyle={{ padding: 16 }}><View style={{ backgroundColor: "#173FD1", borderRadius: 18, padding: 18 }}><Text style={{ color: "#DCE6FF", fontSize: 11 }}>Total Booked Value</Text><Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 5 }}>₹{total}</Text><Text style={{ color: "#BFE8D0", fontSize: 11, marginTop: 4 }}>Calculated from appointment test/service prices</Text></View><EarningsSummary bookings={appointments.length} reports={sent} earnings={total} /><RecentEarnings appointments={appointments} /></ScrollView></SafeAreaView>; }
