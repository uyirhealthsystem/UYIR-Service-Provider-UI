import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorJoinToken, startConsultation, endConsultation } from "../../../api/appointments";

const BLUE = "#0866E8", NAVY = "#14233D", MUTED = "#8D9AAF";

export default function ConsultationRoomScreen({ route, navigation }: any) {
  const appointmentId = String(route?.params?.appointmentId || "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomRole, setRoomRole] = useState("");
  const [active, setActive] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    let mounted = true;
    getDoctorJoinToken(appointmentId)
      .then((response: any) => {
        if (!mounted) return;
        // Backend response: { success, data: { token: { token }, roomId, role } }
        const data = response?.data || {};
        const token = data?.token?.token;
        setJoinToken(typeof token === "string" ? token : "");
        setRoomId(typeof data?.roomId === "string" ? data.roomId : "");
        setRoomRole(typeof data?.role === "string" ? data.role : "");
      })
      .catch((error: any) => {
        if (mounted) Alert.alert("Unable to get 100ms access", error?.message || "The doctor join-token request failed.");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [appointmentId]);

  const start = async () => {
    try {
      setBusy(true);
      await startConsultation(appointmentId);
      setActive(true);
    } catch (error: any) {
      Alert.alert("Could not start consultation", error?.message || "Please try again.");
    } finally { setBusy(false); }
  };

  const finish = async () => {
    try {
      setBusy(true);
      await endConsultation(appointmentId);
      setEnded(true);
      Alert.alert("Consultation ended", "Session status has been updated. You can now complete notes and prescription.");
    } catch (error: any) {
      Alert.alert("Could not end consultation", error?.message || "Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }} edges={["top", "bottom"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name="chevron-back" size={23} color={NAVY} /><Text style={{ color: NAVY, fontWeight: "700", marginLeft: 5 }}>Appointment</Text></Pressable>
        <View style={{ backgroundColor: "#EAF2FF", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20 }}><Text style={{ color: BLUE, fontWeight: "800", fontSize: 11 }}>100ms VIDEO</Text></View>
      </View>

      <View style={{ flex: 1, marginHorizontal: 16, backgroundColor: "#101923", borderRadius: 22, overflow: "hidden", justifyContent: "center", alignItems: "center", padding: 22 }}>
        <View style={{ width: 76, height: 76, borderRadius: 25, backgroundColor: "#1E3146", alignItems: "center", justifyContent: "center" }}><Ionicons name="videocam" size={34} color="#75AEFF" /></View>
        <Text style={{ color: "#FFFFFF", fontSize: 21, fontWeight: "800", marginTop: 20 }}>Secure video consultation</Text>
        <Text style={{ color: "#B9C7D8", fontSize: 12, textAlign: "center", lineHeight: 19, marginTop: 8 }}>Appointment {appointmentId}</Text>
        {loading ? <ActivityIndicator color="#FFFFFF" style={{ marginTop: 20 }} /> : joinToken ? (
          <View style={{ backgroundColor: "#1C2C3E", borderRadius: 13, padding: 13, marginTop: 18, width: "100%" }}>
            <Text style={{ color: "#9DB4CE", fontSize: 11, fontWeight: "700" }}>100ms room credentials</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 12, marginTop: 5 }}>Token received securely from backend</Text>
            <Text style={{ color: "#9DB4CE", fontSize: 10, marginTop: 5 }}>Room: {roomId || "Not returned"}</Text>
            <Text style={{ color: "#9DB4CE", fontSize: 10, marginTop: 3 }}>Role: {roomRole || "Not returned"}</Text>
          </View>
        ) : <Text style={{ color: "#FFB5B5", textAlign: "center", marginTop: 18, fontSize: 12 }}>A doctor join-token was not returned. Check the backend response and appointment permissions.</Text>}
        <View style={{ backgroundColor: "#1C2C3E", borderRadius: 12, padding: 12, marginTop: 15, width: "100%" }}>
          <Text style={{ color: "#B9C7D8", fontSize: 11 }}>Session status</Text>
          <Text style={{ color: ended ? "#FFB5B5" : active ? "#6BE0A7" : "#FFFFFF", fontWeight: "800", marginTop: 4 }}>{ended ? "ENDED" : active ? "ACTIVE" : "WAITING TO START"}</Text>
        </View>
      </View>

      <View style={{ padding: 16, paddingBottom: 8 }}>
        {!active && !ended ? (
          <Pressable disabled={busy || loading || !joinToken} onPress={start} style={{ backgroundColor: BLUE, borderRadius: 15, padding: 16, alignItems: "center", opacity: busy || loading || !joinToken ? 0.55 : 1 }}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Start Consultation</Text>}
          </Pressable>
        ) : null}
        {active && !ended ? <Pressable disabled={busy} onPress={finish} style={{ backgroundColor: "#D83B47", borderRadius: 15, padding: 16, alignItems: "center" }}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>End Consultation</Text>}</Pressable> : null}
        {ended ? <Pressable onPress={() => navigation.navigate("TCConsultationNotes", { appointmentId })} style={{ backgroundColor: BLUE, borderRadius: 15, padding: 16, alignItems: "center" }}><Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Continue to Notes & Prescription</Text></Pressable> : null}
        <Text style={{ color: MUTED, fontSize: 10, textAlign: "center", marginTop: 10, lineHeight: 15 }}>The backend join-token response is parsed using data.token.token, data.roomId and data.role. Native 100ms video rendering still requires the SDK dependency and native build configuration.</Text>
      </View>
    </SafeAreaView>
  );
}
