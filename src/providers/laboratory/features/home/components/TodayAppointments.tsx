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


export default function TodayAppointments({
  appointments,
  navigation,
}: {
  appointments: Appointment[];
  navigation: any;
}) {
  if (!appointments.length) {
    return (
      <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18 }}>
        <Text style={{ color: "#758096", fontSize: 12 }}>No appointments for today.</Text>
      </View>
    );
  }

  return (
    <View>
      {appointments.slice(0, 3).map((appointment) => (
        <Pressable
          key={appointment.appointmentId}
          onPress={() => navigation.navigate("LabAppointmentDetails", { appointmentId: appointment.appointmentId })}
          style={{
            backgroundColor: "#fff",
            borderRadius: 15,
            padding: 14,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "#E8ECF3",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: appointment.appointmentType === "SCAN" ? "#F0EAFE" : "#EAF1FF", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={appointment.appointmentType === "SCAN" ? "scan-outline" : "flask-outline"} size={21} color={appointment.appointmentType === "SCAN" ? "#7B4DE8" : "#173FD1"} />
            </View>
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#172033" }}>{appointment.patient?.name || "Patient"}</Text>
              <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 10.5, color: "#758096" }}>
                {appointmentServiceNames(appointment)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color="#9AA3B2" />
          </View>
          <View style={{ flexDirection: "row", marginTop: 11, alignItems: "center" }}>
            <Ionicons name="time-outline" size={14} color="#173FD1" />
            <Text style={{ marginLeft: 5, fontSize: 10.5, color: "#424B5C" }}>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#159447" }}>₹{appointmentValue(appointment)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function appointmentServiceNames(appointment: Appointment) {
  const names = [
    ...(appointment.tests || []).map((x) => x.labTest?.testCatalog?.name),
    ...(appointment.services || []).map((x) => x.scanService?.serviceCatalog?.name),
  ].filter(Boolean);
  return names.join(" • ") || appointment.appointmentType;
}

function appointmentValue(appointment: Appointment) {
  return [
    ...(appointment.tests || []).map((x) => Number(x.price ?? x.labTest?.price ?? 0)),
    ...(appointment.services || []).map((x) => Number(x.price ?? x.scanService?.price ?? 0)),
  ].reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
