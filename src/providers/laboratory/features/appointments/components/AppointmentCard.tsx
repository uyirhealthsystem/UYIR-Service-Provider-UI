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


export default function AppointmentCard({
  appointment,
  navigation,
}: {
  appointment: Appointment;
  navigation: any;
}) {
  const isScan = appointment.appointmentType === "SCAN";
  const names = [
    ...(appointment.tests || []).map((x) => x.labTest?.testCatalog?.name),
    ...(appointment.services || []).map(
      (x) => x.scanService?.serviceCatalog?.name,
    ),
  ]
    .filter(Boolean)
    .join(" • ");
  const value = [
    ...(appointment.tests || []).map((x) =>
      Number(x.price ?? x.labTest?.price ?? 0),
    ),
    ...(appointment.services || []).map((x) =>
      Number(x.price ?? x.scanService?.price ?? 0),
    ),
  ].reduce((sum, x) => sum + (Number.isFinite(x) ? x : 0), 0);

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("LabAppointmentDetails", {
          appointmentId: appointment.appointmentId,
        })
      }
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
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: isScan ? "#F0EAFE" : "#EAF1FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={isScan ? "scan-outline" : "flask-outline"}
            size={21}
            color={isScan ? "#7B4DE8" : "#173FD1"}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#172033" }}>
            {appointment.patient?.name || "Patient"}
          </Text>
          <Text
            numberOfLines={1}
            style={{ marginTop: 4, fontSize: 10.5, color: "#758096" }}
          >
            {names || (isScan ? "Scan service" : "Lab test")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
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
          <Ionicons
            name="chevron-forward"
            size={17}
            color="#9AA3B2"
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
      <View
        style={{ height: 1, backgroundColor: "#EEF1F5", marginVertical: 11 }}
      />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="calendar-outline" size={14} color="#173FD1" />
        <Text style={{ marginLeft: 5, fontSize: 10.5, color: "#424B5C" }}>
          {formatDate(appointment.appointmentDate)} •{" "}
          {formatTime(appointment.startTime)}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, fontWeight: "900", color: "#159447" }}>
          ₹{value}
        </Text>
      </View>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
      >
        <Ionicons
          name={
            appointment.appointmentMode === "HOME"
              ? "bicycle-outline"
              : "business-outline"
          }
          size={14}
          color={appointment.appointmentMode === "HOME" ? "#14A765" : "#173FD1"}
        />
        <Text
          style={{
            marginLeft: 5,
            fontSize: 10,
            fontWeight: "700",
            color:
              appointment.appointmentMode === "HOME" ? "#14A765" : "#173FD1",
          }}
        >
          {appointment.appointmentMode === "HOME"
            ? "Home Collection"
            : "Center Visit"}
        </Text>
      </View>
    </Pressable>
  );
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
