import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProviderAppointments } from "../../../api/laboratory";
import AppointmentCard from "../components/AppointmentCard";
import AppointmentFilter from "../components/AppointmentFilter";
import AppointmentTabs from "../components/AppointmentTabs";


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


export default function Appointments({ navigation }: any) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState("All");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { context, response } = await getProviderAppointments();
      const data = Array.isArray(response?.data) ? response.data : [];

      console.log("response", "color: #aa00ff", typeof response.data);
      setAppointments(
        data.filter((item: Appointment) =>
          appointmentMatchesProvider(
            item,
            context.lab?.labId,
            context.scanCenter?.scanCenterId,
          ),
        ),
      );
    } catch (error) {
      console.log("Appointments API error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, []),
  );

  const todayKey = new Date().toDateString();
  const filtered = appointments
    .filter((item) => {
      if (
        tab === "Today" &&
        new Date(item.appointmentDate).toDateString() !== todayKey
      )
        return false;
      if (
        tab === "Upcoming" &&
        (item.status === "COMPLETED" ||
          item.status === "CANCELLED" ||
          new Date(item.appointmentDate).getTime() <= Date.now())
      )
        return false;
      if (tab === "Cancelled" && String(item.status).toUpperCase() !== "CANCELLED") return false;
      if (tab === "Rescheduled" && String(item.status).toUpperCase() !== "RESCHEDULED") return false;
      if (filter === "Lab" && item.appointmentType !== "LAB") return false;
      if (filter === "Scan" && item.appointmentType !== "SCAN") return false;
      if (filter === "Home" && item.appointmentMode !== "HOME") return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8FC" }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#172033" }}>
          Appointments
        </Text>
        <AppointmentTabs value={tab} onChange={setTab} />
        <AppointmentFilter value={filter} onChange={setFilter} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4 }}>
        {loading ? (
          <Text style={{ color: "#758096", padding: 12 }}>
            Loading appointments...
          </Text>
        ) : filtered.length ? (
          filtered.map((item) => (
            <AppointmentCard
              key={item.appointmentId}
              appointment={item}
              navigation={navigation}
            />
          ))
        ) : (
          <View
            style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18 }}
          >
            <Text style={{ color: "#758096", fontSize: 12 }}>
              No appointments found.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
