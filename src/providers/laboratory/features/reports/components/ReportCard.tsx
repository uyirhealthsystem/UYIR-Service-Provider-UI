import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";


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


export default function ReportCard({ appointment, navigation }: { appointment: Appointment; navigation: any }) {
  const names = [
    ...(appointment.tests || []).map((x) => x.labTest?.testCatalog?.name),
    ...(appointment.services || []).map((x) => x.scanService?.serviceCatalog?.name),
  ].filter(Boolean).join(" • ");
  return <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E8ECF3" }}><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: appointment.report ? "#E8FAF1" : "#FFF4DF", alignItems: "center", justifyContent: "center" }}><Ionicons name={appointment.report ? "checkmark-done-outline" : "document-text-outline"} size={20} color={appointment.report ? "#159447" : "#E38A00"} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ fontSize: 14, fontWeight: "900", color: "#172033" }}>{appointment.patient?.name || "Patient"}</Text><Text numberOfLines={1} style={{ fontSize: 10.5, color: "#687386", marginTop: 4 }}>{names || appointment.appointmentType}</Text></View><Text style={{ fontSize: 9, fontWeight: "900", color: appointment.report ? "#159447" : "#E38A00" }}>{appointment.report ? "SENT" : "PENDING"}</Text></View><Pressable onPress={() => navigation.navigate("LabUploadReport", { appointmentId: appointment.appointmentId })} style={{ marginTop: 12, borderWidth: 1, borderColor: "#173FD1", borderRadius: 10, padding: 10, alignItems: "center" }}><Text style={{ color: "#173FD1", fontWeight: "800", fontSize: 11 }}>{appointment.report ? "View Report" : "Upload Report"}</Text></Pressable></View>;
}
