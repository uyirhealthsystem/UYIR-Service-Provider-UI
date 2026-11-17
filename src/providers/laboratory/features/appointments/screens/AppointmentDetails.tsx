import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppointment } from "../../../api/laboratory";

const BLUE = "#075DE8";
const NAVY = "#10254B";
const MUTED = "#78869C";
const BORDER = "#E5ECF5";
type Appointment = { [key: string]: any; appointmentId: string; bookingId?: string; status: string; appointmentDate: string; startTime: string; endTime: string; appointmentType?: string; appointmentMode?: string; address?: string; patientNotes?: string; patient?: { name?: string; age?: number; gender?: string; phone?: string } | null; tests?: any[]; services?: any[]; report?: any };

export default function AppointmentDetails({ route, navigation }: any) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const appointmentId = route.params?.appointmentId as string | undefined;
  const load = async () => {
    if (!appointmentId) { setLoading(false); return; }
    setLoading(true);
    try { const response = await getAppointment(appointmentId); setAppointment(response?.data || response?.appointment || null); }
    catch (error: any) { Alert.alert("Unable to load appointment", error?.message || "Please try again."); }
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, [appointmentId]));

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FC", justifyContent: "center", alignItems: "center" }}><ActivityIndicator color={BLUE} size="large"/><Text style={{ marginTop: 10, color: MUTED }}>Loading appointment…</Text></SafeAreaView>;
  if (!appointment) return <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FC", padding: 22 }}><Text style={{ color: NAVY, fontSize: 16, fontWeight: "800" }}>Appointment not found</Text><Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}><Text style={{ color: BLUE }}>Go back</Text></Pressable></SafeAreaView>;

  const names = [ ...(appointment.tests || []).map((x: any) => x.labTest?.testCatalog?.name || x.labTest?.name || x.testCatalog?.name), ...(appointment.services || []).map((x: any) => x.scanService?.serviceCatalog?.name || x.scanService?.name) ].filter(Boolean).join(", ") || (appointment.appointmentType === "SCAN" ? "Scan service" : "Lab test");
  const total = [ ...(appointment.tests || []).map((x: any) => Number(x.price ?? x.labTest?.price ?? 0)), ...(appointment.services || []).map((x: any) => Number(x.price ?? x.scanService?.price ?? 0)) ].reduce((sum: number, value: number) => sum + (Number.isFinite(value) ? value : 0), 0);
  const status = String(appointment.status || "PENDING").toUpperCase();
  const completed = status === "COMPLETED";
  const cancelled = status === "CANCELLED";
  const field = (label: string, value: string, icon: keyof typeof Ionicons.glyphMap) => <View key={label} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EEF2F8" }}><View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#F0F5FF", alignItems: "center", justifyContent: "center", marginRight: 10 }}><Ionicons name={icon} size={16} color={BLUE}/></View><View style={{ flex: 1 }}><Text style={{ fontSize: 10, color: MUTED }}>{label}</Text><Text style={{ fontSize: 12, color: NAVY, fontWeight: "700", marginTop: 4, lineHeight: 17 }}>{value || "-"}</Text></View></View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FC" }} edges={["top"]}>
    <View style={{ height: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}><Pressable onPress={() => navigation.goBack()} style={{ padding: 5 }}><Ionicons name="chevron-back" size={24} color={NAVY}/></Pressable><Text style={{ flex: 1, textAlign: "center", marginRight: 30, fontSize: 17, color: NAVY, fontWeight: "900" }}>Appointment Details</Text></View>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}><View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={25} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ fontSize: 14, fontWeight: "900", color: NAVY }}>{appointment.patient?.name || "Patient"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>{[appointment.patient?.gender, appointment.patient?.age ? `${appointment.patient.age} yrs` : null].filter(Boolean).join(" · ") || "Patient details"}</Text><Text style={{ color: MUTED, fontSize: 9, marginTop: 3 }}>#{appointment.bookingId || appointment.appointmentId}</Text></View><View style={{ backgroundColor: completed ? "#E6F7EE" : cancelled ? "#FDECEF" : "#FFF4DC", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: completed ? "#13824A" : cancelled ? "#D52F43" : "#9A6500", fontSize: 9, fontWeight: "900" }}>{status.replace(/_/g, " ")}</Text></View></View>
        <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 7 }}/>
        {field("Date", formatDate(appointment.appointmentDate), "calendar-outline")}
        {field("Time", `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`, "time-outline")}
        {field("Visit Type", appointment.appointmentType === "SCAN" ? "Scan" : "Lab Test", "flask-outline")}
        {field("Mode", appointment.appointmentMode === "HOME" ? "Home Collection" : "Center Visit", "business-outline")}
        {field("Address", appointment.address || "-", "location-outline")}
        {field("Tests / Services", names, "document-text-outline")}
        {field("Patient Notes", appointment.patientNotes || "-", "chatbox-ellipses-outline")}
        <View style={{ paddingTop: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ fontSize: 12, color: NAVY, fontWeight: "900" }}>Booking Value</Text><Text style={{ fontSize: 18, color: "#159447", fontWeight: "900" }}>₹{total}</Text></View>
      </View>
      {appointment.report ? <View style={{ backgroundColor: "#EAF8F0", borderRadius: 12, padding: 13, marginTop: 12, flexDirection: "row", alignItems: "center" }}><Ionicons name="checkmark-circle" size={19} color="#16844B"/><Text style={{ color: "#16844B", fontWeight: "800", fontSize: 11, marginLeft: 8 }}>Report already uploaded</Text></View> : null}
      {!completed && !cancelled ? <View style={{ marginTop: 14, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 9 }}><Pressable onPress={() => navigation.navigate("LabCancelReschedule", { appointmentId: appointment.appointmentId, mode: "cancel" })} style={{ flex: 1, borderWidth: 1, borderColor: "#FF5865", backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}><Text style={{ color: "#E83B48", fontSize: 12, fontWeight: "900" }}>Cancel</Text></Pressable><Pressable onPress={() => navigation.navigate("LabCancelReschedule", { appointmentId: appointment.appointmentId, mode: "reschedule" })} style={{ flex: 1, borderWidth: 1, borderColor: "#6F8EFF", backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}><Text style={{ color: BLUE, fontSize: 12, fontWeight: "900" }}>Reschedule</Text></Pressable></View>
        <Pressable onPress={() => navigation.navigate("LabUploadReport", { appointmentId: appointment.appointmentId })} style={{ backgroundColor: BLUE, borderRadius: 12, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center" }}><Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF"/><Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 12, marginLeft: 8 }}>{appointment.report ? "View / Continue Report" : "Next: Upload Report"}</Text><Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }}/></Pressable>
      </View> : null}
      {completed ? <View style={{ marginTop: 14, padding: 14, backgroundColor: "#EAF8F0", borderRadius: 12, flexDirection: "row", alignItems: "center" }}><Ionicons name="checkmark-circle" size={20} color="#159447"/><Text style={{ marginLeft: 8, color: "#159447", fontWeight: "800" }}>Test completed successfully</Text></View> : null}
    </ScrollView>
  </SafeAreaView>;
}
function formatDate(value?: string) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function formatTime(value?: string) { if (!value) return "-"; if (/^\d{1,2}:\d{2}/.test(value) && !value.includes("T")) { const [h, m] = value.split(":"); const hour = Number(h); return `${hour % 12 || 12}:${m.slice(0,2)} ${hour >= 12 ? "PM" : "AM"}`; } const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); }
