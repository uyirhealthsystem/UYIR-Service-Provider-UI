import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProviderAppointments } from "../../../api/laboratory";
import QuickActions from "../components/QuickActions";
import SectionHeader from "../components/SectionHeader";
import SummaryCards from "../components/SummaryCards";
import TodayAppointments from "../components/TodayAppointments";


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


export default function Home({ navigation }: any) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [labName, setLabName] = useState("Laboratory");
  const [district, setDistrict] = useState("Tamil Nadu");
  const [loading, setLoading] = useState(true);

  const loadHome = async () => {
    setLoading(true);
    try {
      const { context, response: appointmentResponse } =
        await getProviderAppointments();

      const providerAppointments = Array.isArray(appointmentResponse?.data)
        ? appointmentResponse.data.filter((item: Appointment) =>
            appointmentMatchesProvider(
              item,
              context.lab?.labId,
              context.scanCenter?.scanCenterId,
            ),
          )
        : [];

      setAppointments(providerAppointments);
      setLabName(context.lab?.name || context.scanCenter?.name || "Laboratory");
      setDistrict(
        context.lab?.districtId ||
          context.scanCenter?.districtId ||
          "Tamil Nadu",
      );
    } catch (error) {
      console.log("Laboratory Home API error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, []),
  );

  const todayKey = new Date().toDateString();

  const today = appointments.filter(
    (item) => new Date(item.appointmentDate).toDateString() === todayKey,
  );

  const upcoming = appointments
    .filter(
      (item) =>
        item.status !== "COMPLETED" &&
        item.status !== "CANCELLED" &&
        new Date(item.appointmentDate).getTime() > Date.now(),
    )
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime(),
    )
    .slice(0, 3);

  const recent = appointments
    .filter((item) => item.status !== "CANCELLED")
    .sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime(),
    )
    .slice(0, 3);

  const homeAppointments = today.length ? today : recent;

  const homeCollections = appointments.filter(
    (item) => item.appointmentMode === "HOME",
  ).length;
  const reportsPending = appointments.filter(
    (item) => !item.report && item.status !== "CANCELLED",
  ).length;
  const bookedValue = today.reduce(
    (sum, item) => sum + appointmentValue(item),
    0,
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F6F8FC" }}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View
          style={{
            backgroundColor: "#173FD1",
            paddingHorizontal: 20,
            paddingTop: 9,
            paddingBottom: 22,
            borderBottomLeftRadius: 26,
            borderBottomRightRadius: 26,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
                Good morning, {labName} 👋
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 5,
                }}
              >
                <Ionicons name="location-outline" size={13} color="#DCE6FF" />
                <Text
                  style={{ color: "#DCE6FF", fontSize: 10.5, marginLeft: 4 }}
                >
                  {district}
                </Text>
              </View>
            </View>
            <Pressable
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View
                style={{
                  position: "absolute",
                  right: 9,
                  top: 8,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#FFCF40",
                }}
              />
            </Pressable>
          </View>
          <SummaryCards
            appointments={today.length}
            homeCollections={homeCollections}
            reportsPending={reportsPending}
            earnings={bookedValue}
          />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <SectionHeader
            title={today.length ? "Today's Appointments" : "Recent Appointments"}
            onPress={() => navigation.navigate("Appointments")}
          />
          {loading ? (
            <View
              style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18 }}
            >
              <Text style={{ color: "#758096", fontSize: 12 }}>
                Loading appointments...
              </Text>
            </View>
          ) : (
            <TodayAppointments appointments={homeAppointments} navigation={navigation} />
          )}

          <View style={{ marginTop: 8 }}>
            <QuickActions navigation={navigation} />
          </View>

          <View style={{ marginTop: 22 }}>
            <SectionHeader
              title="Upcoming"
              onPress={() => navigation.navigate("Appointments")}
            />
            {upcoming.length ? (
              upcoming.map((item) => (
                <TodayAppointments
                  key={item.appointmentId}
                  appointments={[item]}
                  navigation={navigation}
                />
              ))
            ) : (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 18,
                }}
              >
                <Text style={{ color: "#758096", fontSize: 12 }}>
                  No upcoming appointments.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
