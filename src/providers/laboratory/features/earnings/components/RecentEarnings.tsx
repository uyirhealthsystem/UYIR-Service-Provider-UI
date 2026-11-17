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

export default function RecentEarnings({
  appointments,
}: {
  appointments: Appointment[];
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>
        Recent Bookings
      </Text>
      {appointments.slice(0, 5).map((item) => {
        const value = [
          ...(item.tests || []).map((x) =>
            Number(x.price ?? x.labTest?.price ?? 0),
          ),
          ...(item.services || []).map((x) =>
            Number(x.price ?? x.scanService?.price ?? 0),
          ),
        ].reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);
        return (
          <View
            key={item.appointmentId}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: "#EEF1F5",
            }}
          >
            <View>
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: "#343D4D" }}
              >
                {item.patient?.name || "Patient"}
              </Text>
              <Text style={{ fontSize: 9, color: "#758096", marginTop: 3 }}>
                {item.bookingId}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#159447" }}>
              ₹{value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
