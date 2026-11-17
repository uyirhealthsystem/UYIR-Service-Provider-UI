import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorAppointments, getPendingDoctorAppointments, confirmDoctorAppointment, rejectDoctorAppointment } from "../../../api/appointments";
import { getLocalDateString } from "../../../api/date";

const BLUE = "#0866E8", NAVY = "#14233D", MUTED = "#8490A3", LINE = "#E9EEF5";
function rows(value: any): any[] {
  if (Array.isArray(value)) return value;
  return value?.data?.appointments || value?.appointments || value?.data || value?.items || [];
}
function statusOf(item: any) { return String(item?.status || "SCHEDULED").toUpperCase(); }
function patientOf(item: any) { return item?.patient?.fullName || item?.patient?.name || item?.patientName || "Patient"; }
function timeOf(item: any) {
  const value = item?.scheduledAt || item?.appointmentDateTime || item?.dateTime;
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time pending";
}

export default function AppointmentsScreen({ navigation }: any) {
  const [tab, setTab] = useState<"Today" | "Upcoming" | "Completed">("Today");
  const [items, setItems] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const date = getLocalDateString();
    const [all, waiting] = await Promise.allSettled([getDoctorAppointments(date), getPendingDoctorAppointments(date)]);
    if (all.status === "fulfilled") setItems(rows(all.value));
    if (waiting.status === "fulfilled") setPending(rows(waiting.value));
    if (all.status === "rejected" && waiting.status === "rejected") throw all.reason;
  }, []);

  useEffect(() => { load().catch((error) => Alert.alert("Appointments unavailable", error?.message || "Could not load appointments.")).finally(() => setLoading(false)); }, [load]);

  const visible = items.filter((item) => {
    const status = statusOf(item);
    if (tab === "Completed") return ["COMPLETED", "ENDED"].includes(status);
    if (tab === "Upcoming") return !["COMPLETED", "ENDED", "CANCELLED", "REJECTED"].includes(status) && new Date(item?.scheduledAt || 0).getTime() > Date.now();
    return true;
  });

  const act = async (id: string, fn: () => Promise<any>, message: string) => {
    try { setBusyId(id); await fn(); await load(); Alert.alert(message); }
    catch (error: any) { Alert.alert("Request failed", error?.message || "Please try again."); }
    finally { setBusyId(""); }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }} edges={["top"]}>
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: NAVY, fontSize: 26, fontWeight: "800" }}>Appointments</Text>
      <Text style={{ color: MUTED, marginTop: 5, fontSize: 12 }}>Manage your patient consultations</Text>
      <View style={{ flexDirection: "row", backgroundColor: "#EAEFF6", padding: 4, borderRadius: 13, marginTop: 20 }}>
        {(["Today", "Upcoming", "Completed"] as const).map((name) => <Pressable key={name} onPress={() => setTab(name)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: tab === name ? BLUE : "transparent" }}><Text style={{ color: tab === name ? "#FFFFFF" : MUTED, fontSize: 12, fontWeight: "800" }}>{name}</Text></Pressable>)}
      </View>
      {pending.length > 0 && tab !== "Completed" ? <View style={{ marginTop: 18, backgroundColor: "#FFF8E9", borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center" }}><Ionicons name="alert-circle-outline" size={20} color="#B7791F" /><Text style={{ color: "#805B1B", fontSize: 12, fontWeight: "700", marginLeft: 8 }}>{pending.length} appointment(s) awaiting your response</Text></View> : null}
      {loading ? <ActivityIndicator color={BLUE} style={{ marginTop: 35 }} /> : visible.length === 0 ? (
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 28, alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: LINE }}>
          <Ionicons name="calendar-clear-outline" size={34} color="#AAB5C5" />
          <Text style={{ color: NAVY, fontSize: 15, fontWeight: "800", marginTop: 12 }}>No {tab.toLowerCase()} appointments</Text>
          <Text style={{ color: MUTED, fontSize: 12, textAlign: "center", marginTop: 5 }}>Appointments returned by the backend will appear here.</Text>
        </View>
      ) : visible.map((item, index) => {
        const id = String(item?.id || item?.appointmentId || "");
        const status = statusOf(item);
        const isPending = pending.some((p) => String(p?.id || p?.appointmentId) === id);
        return <Pressable key={id || index} onPress={() => navigation.navigate("TCAppointmentDetails", { appointmentId: id, appointment: item })} style={{ backgroundColor: "#FFFFFF", borderRadius: 17, padding: 14, marginTop: 12, borderWidth: 1, borderColor: LINE }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: "#EAF2FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person-outline" size={22} color={BLUE} /></View>
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Text style={{ color: NAVY, fontSize: 14, fontWeight: "800" }}>{patientOf(item)}</Text>
              <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>{timeOf(item)}  ·  {item?.reason || item?.mode || "Video consultation"}</Text>
            </View>
            <View style={{ backgroundColor: isPending ? "#FFF4DF" : "#EAF2FF", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 }}><Text style={{ color: isPending ? "#A56A0A" : BLUE, fontSize: 10, fontWeight: "800" }}>{isPending ? "PENDING" : status}</Text></View>
          </View>
          {isPending ? <View style={{ flexDirection: "row", marginTop: 13 }}>
            <Pressable disabled={!!busyId} onPress={() => act(id, () => confirmDoctorAppointment(id), "Appointment confirmed")} style={{ flex: 1, backgroundColor: BLUE, padding: 11, borderRadius: 10, alignItems: "center", marginRight: 7 }}><Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 12 }}>{busyId === id ? "Please wait..." : "Confirm"}</Text></Pressable>
            <Pressable disabled={!!busyId} onPress={() => Alert.alert("Reject appointment", "Reject this appointment?", [{ text: "Cancel", style: "cancel" }, { text: "Reject", style: "destructive", onPress: () => act(id, () => rejectDoctorAppointment(id, "Doctor unavailable"), "Appointment rejected") }])} style={{ flex: 1, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E1E7EF", padding: 11, borderRadius: 10, alignItems: "center" }}><Text style={{ color: "#C43D46", fontWeight: "800", fontSize: 12 }}>Reject</Text></Pressable>
          </View> : null}
        </Pressable>;
      })}
    </ScrollView>
  </SafeAreaView>;
}
