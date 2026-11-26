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

export default function HomeCollectionCard({ appointment, navigation }: { appointment: Appointment; navigation: any }) {
  const collection = appointment.homeCollection;
  const collector =
    collection?.collectorAssignment?.collector ||
    collection?.assignedCollector ||
    collection?.collector ||
    null;
  const stage = collection?.allocationStage;
  const statusText = collection?.status || "PENDING";

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("LabHomeCollectionDetails", {
          appointmentId: appointment.appointmentId,
          homeCollectionId: collection?.homeCollectionId,
          appointment,
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
            backgroundColor: "#E8FAF1",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="bicycle-outline" size={21} color="#14A765" />
        </View>
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#172033" }}>
            {appointment.patient?.name || "Patient"}
          </Text>
          <Text style={{ fontSize: 10.5, color: "#758096", marginTop: 4 }}>
            {formatDate(appointment.appointmentDate)} • {formatTime(appointment.startTime)}
            {stage ? ` • ${stageLabel(stage)}` : ""}
          </Text>
        </View>
        <Text style={{ fontSize: 9, fontWeight: "900", color: statusColor(statusText) }}>
          {statusText}
        </Text>
      </View>
      <View style={{ height: 1, backgroundColor: "#EEF1F5", marginVertical: 11 }} />
      <Text style={{ fontSize: 10, color: "#687386" }} numberOfLines={1}>
        {collection?.address || appointment.address || "Address unavailable"}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <Ionicons name="person-outline" size={14} color="#173FD1" />
        <Text style={{ marginLeft: 5, fontSize: 10.5, fontWeight: "700", color: "#343D4D" }}>
          {collector?.name ||
            (stage === "INDEPENDENT_POOL"
              ? "In independent collector pool"
              : "Collector not assigned / details pending")}
        </Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={16} color="#9AA3B2" />
      </View>
    </Pressable>
  );
}

function stageLabel(stage: string) {
  if (stage === "INDEPENDENT_POOL") return "Independent Pool";
  if (stage === "LAB_COLLECTORS") return "Lab Collectors";
  if (stage === "ASSIGNED") return "Assigned";
  return stage;
}

function statusColor(status?: string) {
  if (status === "RECEIVED" || status === "COMPLETED") return "#159447";
  if (status === "ASSIGNED" || status === "IN_TRANSIT" || status === "COLLECTED") return "#E38A00";
  return "#173FD1";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}