import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { completeAppointment, getAppointment } from "../../../api/laboratory";

const BLUE = "#075DE8";
const NAVY = "#10254B";
const MUTED = "#78869C";
const BORDER = "#E5ECF5";
type Appointment = { [key: string]: any; appointmentId: string; bookingId?: string; status?: string; appointmentDate?: string; startTime?: string; endTime?: string; patient?: { name?: string; age?: number; gender?: string } | null; tests?: any[]; services?: any[]; report?: any };

export default function CompleteTest({ route, navigation }: any) {
  const appointmentId = route.params?.appointmentId as string | undefined;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const reportUploaded = route.params?.reportUploaded === true;

  const load = async () => {
    if (!appointmentId) { setLoading(false); return; }
    setLoading(true);
    try { const response = await getAppointment(appointmentId); setAppointment(response?.data || response?.appointment || null); }
    catch (error: any) { console.log("Complete test load error:", error); }
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, [appointmentId]));

  const completeTest = async () => {
    if (!appointmentId) return Alert.alert("Missing appointment", "The appointment ID was not provided.");
    if (!reportUploaded && !appointment?.report) return Alert.alert("Report required", "Upload the PDF or JPG report successfully before completing the test.");
    if (!confirmed) return Alert.alert("Confirmation required", "Please confirm that the test and report details are correct.");
    setCompleting(true);
    try {
      await completeAppointment(appointmentId);
      Alert.alert("Test completed", "The report is uploaded and the test has been marked as completed.", [{ text: "Done", onPress: () => navigation.popToTop() }]);
    } catch (error: any) { Alert.alert("Could not complete test", error?.message || "The completion API failed. Please retry."); }
    finally { setCompleting(false); }
  };
  const testName = [ ...(appointment?.tests || []).map((x: any) => x.labTest?.testCatalog?.name || x.labTest?.name || x.testCatalog?.name), ...(appointment?.services || []).map((x: any) => x.scanService?.serviceCatalog?.name || x.scanService?.name) ].filter(Boolean).join(", ") || "Lab Test";
  const date = appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date not available";
  const time = `${formatTime(appointment?.startTime)} – ${formatTime(appointment?.endTime)}`;

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FC" }} edges={["top"]}>
    <View style={{ height: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}><Pressable onPress={() => navigation.goBack()} style={{ padding: 5 }}><Ionicons name="chevron-back" size={24} color={NAVY}/></Pressable><Text style={{ flex: 1, textAlign: "center", marginRight: 30, fontSize: 17, color: NAVY, fontWeight: "900" }}>Complete Test</Text></View>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 17, padding: 15, flexDirection: "row", alignItems: "center" }}><View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={24} color={BLUE}/></View><View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: NAVY, fontSize: 13, fontWeight: "900" }}>{loading ? "Loading patient…" : appointment?.patient?.name || "Patient"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>{testName}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{appointment?.bookingId || appointmentId}</Text></View></View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 20 }}><Step label="Appointment" done/><View style={{ flex: 1, height: 2, backgroundColor: BLUE }}/><Step label="Upload report" done/><View style={{ flex: 1, height: 2, backgroundColor: BLUE }}/><Step label="Complete" active/></View>
      <View style={{ backgroundColor: "#E8F8EF", borderRadius: 16, padding: 20, alignItems: "center", marginTop: 4 }}><View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: "#D0F4DF", alignItems: "center", justifyContent: "center" }}><Ionicons name="checkmark-circle" size={43} color="#159447"/></View><Text style={{ color: "#126F40", fontSize: 17, fontWeight: "900", marginTop: 12 }}>Report uploaded successfully</Text><Text style={{ color: "#4E7863", fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 6 }}>Please verify the report and appointment details before marking this test as completed.</Text></View>
      <View style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 15, padding: 15, marginTop: 14 }}><Text style={{ color: NAVY, fontSize: 13, fontWeight: "900", marginBottom: 12 }}>Appointment summary</Text><Summary label="Date" value={date}/><Summary label="Time" value={time}/><Summary label="Test / Service" value={testName}/><Summary label="Booking ID" value={appointment?.bookingId || appointmentId || "-"}/><View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 15 }}><Pressable onPress={() => setConfirmed((prev) => !prev)} style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: confirmed ? BLUE : "#B8C4D5", backgroundColor: confirmed ? BLUE : "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 10 }}><Ionicons name="checkmark" size={15} color={confirmed ? "#FFFFFF" : "transparent"}/></Pressable><Text onPress={() => setConfirmed((prev) => !prev)} style={{ flex: 1, color: NAVY, fontSize: 11, lineHeight: 17 }}>I confirm the test has been completed and the uploaded report is correct.</Text></View></View>
      <Pressable onPress={completeTest} disabled={completing || loading} style={{ backgroundColor: completing || loading ? "#AAB8D0" : BLUE, borderRadius: 13, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 14 }}><Ionicons name="checkmark-circle" size={19} color="#FFFFFF"/><Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900", marginLeft: 8 }}>{completing ? "Completing test…" : "Complete Test"}</Text></Pressable>
      <Text style={{ color: MUTED, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 10 }}>The appointment status changes only after the completion API succeeds.</Text>
    </ScrollView>
  </SafeAreaView>;
}
function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) { return <View style={{ alignItems: "center", minWidth: 72 }}><View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: done ? "#159447" : active ? BLUE : "#E6ECF5" }}><Ionicons name={done ? "checkmark" : active ? "checkmark" : "ellipse-outline"} size={15} color={done || active ? "#FFFFFF" : MUTED}/></View><Text style={{ color: done || active ? BLUE : MUTED, fontSize: 9, fontWeight: "800", marginTop: 5 }}>{label}</Text></View>; }
function Summary({ label, value }: { label: string; value: string }) { return <View style={{ flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#EEF2F8" }}><Text style={{ width: 100, color: MUTED, fontSize: 10 }}>{label}</Text><Text style={{ flex: 1, color: NAVY, fontSize: 11, fontWeight: "700" }}>{value}</Text></View>; }
function formatTime(value?: string) { if (!value) return "--"; if (/^\d{1,2}:\d{2}/.test(value) && !value.includes("T")) { const [h, m] = value.split(":"); const hour = Number(h); return `${hour % 12 || 12}:${m.slice(0, 2)} ${hour >= 12 ? "PM" : "AM"}`; } const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); }
