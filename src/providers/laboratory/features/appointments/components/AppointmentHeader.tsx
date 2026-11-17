import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";


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


export default function AppointmentHeader({
  appointment,
}: {
  appointment: Appointment;
}) {
  const isScan = appointment.appointmentType === "SCAN";
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 15,
          backgroundColor: isScan ? "#F0EAFE" : "#EAF1FF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={isScan ? "scan-outline" : "flask-outline"}
          size={23}
          color={isScan ? "#7B4DE8" : "#173FD1"}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text style={{ fontSize: 17, fontWeight: "900", color: "#172033" }}>
          {appointment.patient?.name || "Patient"}
        </Text>
        <Text style={{ color: "#687386", fontSize: 11, marginTop: 4 }}>
          {appointment.patient?.phone || "Phone unavailable"}
        </Text>
      </View>
      <Text
        style={{
          color:
            appointment.status === "COMPLETED"
              ? "#159447"
              : appointment.status === "CANCELLED"
                ? "#E72B3A"
                : "#173FD1",
          fontSize: 9,
          fontWeight: "900",
        }}
      >
        {appointment.status}
      </Text>
    </View>
  );
}
