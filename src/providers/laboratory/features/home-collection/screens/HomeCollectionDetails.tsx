import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { generateSampleHandoverOtp, getAppointment, getHomeCollection, updateLabSampleStatus } from "../../../api/laboratory";
import CollectionTimeline from "../components/CollectionTimeline";


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

type HomeCollection = { [key: string]: any; homeCollectionId: string; appointmentId: string; address?: string | null; specialInstructions?: string | null; status?: string; assignedAt?: string | null; collectedAt?: string | null; completedAt?: string | null; appointment?: Appointment | null; collectorAssignment?: any; trackingEvents?: Array<{ status?: string; createdAt?: string; note?: string }> };


export default function HomeCollectionDetails({ route, navigation }: any) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [collection, setCollection] = useState<HomeCollection | null>(null);
  const appointmentId = route.params?.appointmentId;
  const homeCollectionId = route.params?.homeCollectionId;

  const load = async () => {
    try {
      if (appointmentId) {
        const response = await getAppointment(appointmentId);
        const data = response?.data;
        setAppointment(data || null);
        if (data?.homeCollection?.homeCollectionId) setCollection(data.homeCollection);
      }
      if (homeCollectionId) {
        const response = await getHomeCollection(homeCollectionId);
        setCollection(response?.data || null);
        if (!appointmentId && response?.data?.appointment) setAppointment(response.data.appointment);
      }
    } catch (error) { console.log("Home collection details API error:", error); }
  };
  useFocusEffect(useCallback(() => { load(); }, [appointmentId, homeCollectionId]));

  const collector = collection?.collectorAssignment?.collector;
  const location = collection?.location || appointment?.homeCollection?.location || appointment?.location || {};
  const patientLat = Number(location.latitude ?? location.lat);
  const patientLon = Number(location.longitude ?? location.lng ?? location.lon);
  const hasPatientCoordinates = Number.isFinite(patientLat) && Number.isFinite(patientLon) && Math.abs(patientLat) > 0.01 && Math.abs(patientLon) > 0.01;
  const samples = collection?.samples || appointment?.homeCollection?.samples || [];

  const generateOtp = async (sampleId: string) => {
    try {
      const response = await generateSampleHandoverOtp(sampleId);
      const data = response?.data || response;
      Alert.alert(
        "Handover OTP generated",
        data?.debugOtp
          ? `OTP: ${data.debugOtp}\nGive this OTP to the collector.`
          : "Share the generated OTP through the approved lab/notification channel.",
      );
      await load();
    } catch (error: any) {
      Alert.alert("Unable to generate OTP", error?.message || "Please try again.");
    }
  };

  const startProcessing = async (sampleId: string) => {
    try {
      await updateLabSampleStatus(sampleId, { status: "PROCESSING" });
      Alert.alert("Processing started", "The sample status is now PROCESSING.");
      await load();
    } catch (error: any) {
      Alert.alert("Unable to update sample", error?.message || "Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8FC" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 18 }}>
        <Pressable onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color="#172033" /></Pressable>
        <Text style={{ flex: 1, textAlign: "center", marginRight: 24, fontSize: 18, fontWeight: "800", color: "#172033" }}>Collection Details</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {appointment ? (
          <>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: "#172033" }}>{appointment.patient?.name || "Patient"}</Text>
              <Text style={{ fontSize: 11, color: "#687386", marginTop: 4 }}>{appointment.patient?.phone || "Phone unavailable"}</Text>
              <Text style={{ fontSize: 10, color: "#7B8190", marginTop: 14 }}>Appointment</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", marginTop: 4 }}>{new Date(appointment.appointmentDate).toLocaleDateString("en-IN")} • {new Date(appointment.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</Text>
              <Text style={{ fontSize: 10, color: "#7B8190", marginTop: 14 }}>Collection Address</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", marginTop: 4 }}>{collection?.address || appointment.address || "-"}</Text>
            </View>
            <CollectionTimeline collection={collection} />
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 14, marginTop: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Home collection location</Text>
              <Text style={{ fontSize: 11, color: "#687386", marginTop: 4 }}>OpenStreetMap · Free map tiles</Text>
              <View style={{ height: 220, borderRadius: 12, overflow: "hidden", marginTop: 10 }}>
                <MapView style={{ flex: 1 }} mapType="none" initialRegion={{ latitude: hasPatientCoordinates ? patientLat : 13.0827, longitude: hasPatientCoordinates ? patientLon : 80.2707, latitudeDelta: 0.03, longitudeDelta: 0.03 }}>
                  <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
                  {hasPatientCoordinates ? <Marker coordinate={{ latitude: patientLat, longitude: patientLon }} title="Collection location" /> : null}
                </MapView>
              </View>
            </View>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Collector Details</Text>
              <Text style={{ marginTop: 10, fontSize: 13, fontWeight: "700", color: "#172033" }}>{collector?.name || "Not available yet"}</Text>
              <Text style={{ marginTop: 3, fontSize: 11, color: "#687386" }}>{collector?.phone || "Collector details will appear when provided by the backend."}</Text>
              <Text style={{ marginTop: 10, fontSize: 10, color: "#758096" }}>Assignment status: {collection?.collectorAssignment?.status || "Not assigned"}</Text>
            </View>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Samples</Text>
              {samples.length === 0 ? (
                <Text style={{ fontSize: 11, color: "#687386", marginTop: 8 }}>No samples are available yet.</Text>
              ) : samples.map((sample: any) => (
                <View key={sample.sampleId} style={{ borderTopWidth: 1, borderTopColor: "#EEF1F5", paddingTop: 12, marginTop: 12 }}>
                  <Text style={{ color: "#172033", fontSize: 12, fontWeight: "800" }}>{sample.sampleType || "Sample"} · {sample.barcode || "No barcode"}</Text>
                  <Text style={{ color: "#687386", fontSize: 10, marginTop: 3 }}>Status: {sample.status || "PENDING_COLLECTION"}</Text>
                  {sample.status === "IN_TRANSIT" ? (
                    <Pressable onPress={() => generateOtp(sample.sampleId)} style={{ backgroundColor: "#173FD1", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 10 }}>
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>Generate handover OTP</Text>
                    </Pressable>
                  ) : null}
                  {sample.status === "RECEIVED" ? (
                    <Pressable onPress={() => startProcessing(sample.sampleId)} style={{ backgroundColor: "#159447", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 10 }}>
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>Start processing</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        ) : <Text style={{ color: "#758096" }}>Loading collection...</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
