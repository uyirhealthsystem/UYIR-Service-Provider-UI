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

type LabBooking = { [key: string]: any; patientName: string; date: string; time: string; tests: string[]; status: string; type?: string; sampleStatus?: string };


export default function HomeAppointmentCard({ booking, onPress }: { booking: LabBooking; onPress: () => void }) {
  const home = booking.type === "HOME_COLLECTION";
  const icon = home ? "bicycle-outline" : "flask-outline";
  const iconColor = home ? "#14A765" : "#173FD1";
  const iconBg = home ? "#E8FAF1" : "#EAF1FF";
  const statusColor = booking.status === "COMPLETED" ? "#159447" : booking.status === "CANCELLED" ? "#E72B3A" : "#173FD1";
  const statusBg = booking.status === "COMPLETED" ? "#E6F8EE" : booking.status === "CANCELLED" ? "#FFE9EC" : "#EAF1FF";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E8ECF3", opacity: pressed ? 0.9 : 1, shadowColor: "#172033", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 })}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginRight: 11 }}>
          <Ionicons name={icon as any} size={21} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#172033" }}>{booking.patientName}</Text>
          <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 10.5, color: "#758096" }}>{booking.tests.join(" • ")}</Text>
        </View>
        <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
          <View style={{ backgroundColor: statusBg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ color: statusColor, fontSize: 9, fontWeight: "900" }}>{booking.status}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#9AA3B2" style={{ marginTop: 9 }} />
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: "#EEF1F5", marginVertical: 12 }} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons name="time-outline" size={15} color="#173FD1" />
          <Text style={{ marginLeft: 6, fontSize: 10.5, color: "#424B5C" }}>{booking.date} • {booking.time}</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: "900", color: "#172033" }}>₹{booking.amount}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 9 }}>
        <Ionicons name={icon as any} size={14} color={iconColor} />
        <Text style={{ marginLeft: 6, fontSize: 10.5, fontWeight: "700", color: iconColor }}>{home ? "Home Collection" : "Lab Visit"}</Text>
      </View>
    </Pressable>
  );
}
