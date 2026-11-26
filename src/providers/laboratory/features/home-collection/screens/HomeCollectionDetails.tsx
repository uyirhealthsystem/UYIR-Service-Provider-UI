import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  acknowledgeHomeCollection,
  assignLabCollector,
  generateSampleHandoverOtp,
  getAppointment,
  getCollectors,
  getHomeCollection,
  getHomeCollectionByAppointment,
  pushHomeCollectionToIndependentPool,
  updateLabSampleStatus,
} from "../../../api/laboratory";
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

type HomeCollection = {
  [key: string]: any;
  homeCollectionId: string;
  appointmentId: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  specialInstructions?: string | null;
  status?: string;
  allocationStage?: string;
  matchingStartedAt?: string | null;
  assignmentDeadline?: string | null;
  assignedAt?: string | null;
  collectedAt?: string | null;
  completedAt?: string | null;
  appointment?: Appointment | null;
  collectorAssignment?: any;
  trackingEvents?: Array<{ status?: string; createdAt?: string; note?: string }>;
};

export default function HomeCollectionDetails({ route, navigation }: any) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [collection, setCollection] = useState<HomeCollection | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [collectorModalVisible, setCollectorModalVisible] = useState(false);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loadingCollectors, setLoadingCollectors] = useState(false);

  const appointmentId = route.params?.appointmentId;
  const homeCollectionId = route.params?.homeCollectionId;

  const load = async () => {
    try {
      let resolvedHcId = homeCollectionId || collection?.homeCollectionId;

      if (appointmentId) {
        const response = await getAppointment(appointmentId);
        const data = response?.data;
        setAppointment(data || null);
        if (data?.homeCollection) {
          setCollection(data.homeCollection);
          resolvedHcId = data.homeCollection.homeCollectionId || resolvedHcId;
        } else if (!resolvedHcId) {
          try {
            const byAppt = await getHomeCollectionByAppointment(appointmentId);
            const hcData = byAppt?.data?.data ?? byAppt?.data ?? null;
            if (hcData) {
              setCollection(hcData);
              resolvedHcId = hcData.homeCollectionId;
            }
          } catch {}
        }
      }

      if (resolvedHcId) {
        const response = await getHomeCollection(resolvedHcId);
        const hcData = response?.data || null;
        if (hcData) {
          setCollection(hcData);
          if (!appointmentId && hcData.appointment) setAppointment(hcData.appointment);
        }
      }
    } catch (error) {
      console.log("Home collection details API error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [appointmentId, homeCollectionId]),
  );

  const activeHcId = collection?.homeCollectionId || homeCollectionId;
  const labId = appointment?.labId || appointment?.lab?.labId || collection?.labId;
  const collector = collection?.collectorAssignment?.collector;
  const stage = collection?.allocationStage;
  const status = collection?.status || "PENDING";
  const isAcknowledged =
    Boolean(collection?.matchingStartedAt) ||
    stage === "LAB_COLLECTORS" ||
    stage === "INDEPENDENT_POOL" ||
    status !== "PENDING";
  const isAssigned =
    status === "ASSIGNED" ||
    status === "COLLECTED" ||
    status === "IN_TRANSIT" ||
    status === "RECEIVED" ||
    status === "COMPLETED" ||
    Boolean(collector);

  // Tweak 1: Read latitude & longitude from root homeCollection fields first
  const patientLat = Number(
    collection?.latitude ??
      collection?.location?.latitude ??
      collection?.location?.lat ??
      appointment?.latitude ??
      appointment?.location?.latitude,
  );
  const patientLon = Number(
    collection?.longitude ??
      collection?.location?.longitude ??
      collection?.location?.lng ??
      collection?.location?.lon ??
      appointment?.longitude ??
      appointment?.location?.longitude,
  );
  const hasPatientCoordinates =
    Number.isFinite(patientLat) &&
    Number.isFinite(patientLon) &&
    Math.abs(patientLat) > 0.01 &&
    Math.abs(patientLon) > 0.01;
  const samples = collection?.samples || appointment?.homeCollection?.samples || [];

  const handleAcknowledge = async () => {
    if (!activeHcId) return;
    setBusyAction("ack");
    try {
      await acknowledgeHomeCollection(activeHcId);
      Alert.alert("Booking acknowledged", "5-minute lab collector assignment window has started.");
      await load();
    } catch (error: any) {
      Alert.alert("Unable to acknowledge", error?.message || "Please try again.");
    } finally {
      setBusyAction(null);
    }
  };

  const openCollectorPicker = async () => {
    setCollectorModalVisible(true);
    setLoadingCollectors(true);
    try {
      const res = await getCollectors();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

      // Tweak 2: Filter strictly to this lab's active, verified, available non-independent collectors
      const eligible = list.filter((c: any) => {
        const sameLab = Boolean(labId && (c.labId === labId || c.lab?.labId === labId));
        const notIndependent = c.collectorType !== "INDEPENDENT";
        const isActive = c.status === "ACTIVE";
        const isVerified = c.qualificationStatus === "VERIFIED";
        const isAvail = c.isAvailable === true;
        return sameLab && notIndependent && isActive && isVerified && isAvail;
      });
      setCollectors(eligible);
    } catch (error: any) {
      Alert.alert("Unable to load collectors", error?.message || "Please try again.");
    } finally {
      setLoadingCollectors(false);
    }
  };

  const handleAssignCollector = async (collectorId: string, collectorName?: string) => {
    if (!activeHcId) return;
    setBusyAction("assign");
    try {
      await assignLabCollector(activeHcId, collectorId);
      setCollectorModalVisible(false);
      Alert.alert("Collector assigned", `${collectorName || "Lab collector"} has been assigned directly.`);
      await load();
    } catch (error: any) {
      Alert.alert("Assignment failed", error?.message || "Please try again.");
    } finally {
      setBusyAction(null);
    }
  };

  const handlePushToPool = () => {
    if (!activeHcId) return;
    Alert.alert(
      "Push to Independent Pool",
      "This will broadcast the booking to nearby eligible independent collectors. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Push to Pool",
          onPress: async () => {
            setBusyAction("pool");
            try {
              await pushHomeCollectionToIndependentPool(activeHcId);
              Alert.alert("Sent to Independent Pool", "Offers have been sent to eligible independent collectors.");
              await load();
            } catch (error: any) {
              Alert.alert("Escalation failed", error?.message || "Please try again.");
            } finally {
              setBusyAction(null);
            }
          },
        },
      ],
    );
  };

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
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#172033" />
        </Pressable>
        <Text style={{ flex: 1, textAlign: "center", marginRight: 24, fontSize: 18, fontWeight: "800", color: "#172033" }}>
          Collection Details
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {appointment ? (
          <>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 17, fontWeight: "900", color: "#172033" }}>
                  {appointment.patient?.name || "Patient"}
                </Text>
                <View style={{ backgroundColor: "#EEF3FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: "#173FD1" }}>{status}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: "#687386", marginTop: 4 }}>
                {appointment.patient?.phone || "Phone unavailable"}
              </Text>
              <Text style={{ fontSize: 10, color: "#7B8190", marginTop: 14 }}>Appointment</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", marginTop: 4 }}>
                {new Date(appointment.appointmentDate).toLocaleDateString("en-IN")} •{" "}
                {new Date(appointment.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </Text>
              <Text style={{ fontSize: 10, color: "#7B8190", marginTop: 14 }}>Collection Address</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", marginTop: 4 }}>
                {collection?.address || appointment.address || "-"}
              </Text>
            </View>

            {activeHcId && !isAssigned ? (
              <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Lab Dispatch</Text>
                <Text style={{ fontSize: 11, color: "#687386", marginTop: 4 }}>
                  Stage: {stage || (isAcknowledged ? "LAB_COLLECTORS" : "Awaiting acknowledgment")}
                  {collection?.assignmentDeadline
                    ? ` • Window ends ${new Date(collection.assignmentDeadline).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
                    : ""}
                </Text>

                {!isAcknowledged ? (
                  <Pressable
                    disabled={busyAction !== null}
                    onPress={handleAcknowledge}
                    style={{
                      backgroundColor: "#173FD1",
                      borderRadius: 12,
                      padding: 13,
                      alignItems: "center",
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
                      {busyAction === "ack" ? "Acknowledging..." : "Acknowledge Booking"}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ marginTop: 12, gap: 10 }}>
                    <Pressable
                      disabled={busyAction !== null}
                      onPress={openCollectorPicker}
                      style={{
                        backgroundColor: "#159447",
                        borderRadius: 12,
                        padding: 13,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
                        {busyAction === "assign" ? "Assigning..." : "Assign Lab Collector"}
                      </Text>
                    </Pressable>

                    {stage !== "INDEPENDENT_POOL" ? (
                      <Pressable
                        disabled={busyAction !== null}
                        onPress={handlePushToPool}
                        style={{
                          backgroundColor: "#FFF5E6",
                          borderWidth: 1,
                          borderColor: "#F5C26B",
                          borderRadius: 12,
                          padding: 13,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#B86E00", fontWeight: "900", fontSize: 12 }}>
                          {busyAction === "pool" ? "Pushing to pool..." : "Push to Independent Pool"}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={{ backgroundColor: "#FFF8EB", borderRadius: 10, padding: 10 }}>
                        <Text style={{ color: "#B86E00", fontSize: 11, fontWeight: "700" }}>
                          Sent to independent collector pool — waiting for a collector to accept.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : null}

            <CollectionTimeline collection={collection} />

            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 14, marginTop: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Home collection location</Text>
              <Text style={{ fontSize: 11, color: "#687386", marginTop: 4 }}>OpenStreetMap · Free map tiles</Text>
              <View style={{ height: 220, borderRadius: 12, overflow: "hidden", marginTop: 10 }}>
                <MapView
                  style={{ flex: 1 }}
                  mapType="none"
                  initialRegion={{
                    latitude: hasPatientCoordinates ? patientLat : 13.0827,
                    longitude: hasPatientCoordinates ? patientLon : 80.2707,
                    latitudeDelta: 0.03,
                    longitudeDelta: 0.03,
                  }}
                >
                  <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
                  {hasPatientCoordinates ? (
                    <Marker coordinate={{ latitude: patientLat, longitude: patientLon }} title="Collection location" />
                  ) : null}
                </MapView>
              </View>
            </View>

            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Collector Details</Text>
              <Text style={{ marginTop: 10, fontSize: 13, fontWeight: "700", color: "#172033" }}>
                {collector?.name || "Not available yet"}
              </Text>
              <Text style={{ marginTop: 3, fontSize: 11, color: "#687386" }}>
                {collector?.phone || "Collector details will appear when assigned."}
              </Text>
              <Text style={{ marginTop: 10, fontSize: 10, color: "#758096" }}>
                Assignment status: {collection?.collectorAssignment?.status || "Not assigned"}
                {collection?.collectorAssignment?.source ? ` (${collection.collectorAssignment.source})` : ""}
              </Text>
            </View>

            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#172033" }}>Samples</Text>
              {samples.length === 0 ? (
                <Text style={{ fontSize: 11, color: "#687386", marginTop: 8 }}>No samples are available yet.</Text>
              ) : (
                samples.map((sample: any) => (
                  <View
                    key={sample.sampleId}
                    style={{ borderTopWidth: 1, borderTopColor: "#EEF1F5", paddingTop: 12, marginTop: 12 }}
                  >
                    <Text style={{ color: "#172033", fontSize: 12, fontWeight: "800" }}>
                      {sample.sampleType || "Sample"} · {sample.barcode || "No barcode"}
                    </Text>
                    <Text style={{ color: "#687386", fontSize: 10, marginTop: 3 }}>
                      Status: {sample.status || "PENDING_COLLECTION"}
                    </Text>
                    {sample.status === "IN_TRANSIT" ? (
                      <Pressable
                        onPress={() => generateOtp(sample.sampleId)}
                        style={{
                          backgroundColor: "#173FD1",
                          borderRadius: 10,
                          padding: 12,
                          alignItems: "center",
                          marginTop: 10,
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>Generate handover OTP</Text>
                      </Pressable>
                    ) : null}
                    {sample.status === "RECEIVED" ? (
                      <Pressable
                        onPress={() => startProcessing(sample.sampleId)}
                        style={{
                          backgroundColor: "#159447",
                          borderRadius: 10,
                          padding: 12,
                          alignItems: "center",
                          marginTop: 10,
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>Start processing</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <Text style={{ color: "#758096" }}>Loading collection...</Text>
        )}
      </ScrollView>

      <Modal
        visible={collectorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCollectorModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: "70%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#172033" }}>Select Available Lab Collector</Text>
              <Pressable onPress={() => setCollectorModalVisible(false)}>
                <Ionicons name="close" size={22} color="#687386" />
              </Pressable>
            </View>

            {loadingCollectors ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color="#173FD1" />
            ) : collectors.length === 0 ? (
              <Text style={{ color: "#687386", fontSize: 12, marginVertical: 16 }}>
                No active, verified, available collectors found for this lab. You can push this booking to the independent pool instead.
              </Text>
            ) : (
              <ScrollView>
                {collectors.map((item: any) => {
                  const id = item.collectorId || item.id;
                  return (
                    <Pressable
                      key={id}
                      disabled={busyAction !== null}
                      onPress={() => handleAssignCollector(id, item.name)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#EEF1F5",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#172033" }}>{item.name || "Collector"}</Text>
                        <Text style={{ fontSize: 11, color: "#687386", marginTop: 2 }}>{item.phone || id}</Text>
                      </View>
                      <View style={{ backgroundColor: "#E8FAF1", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <Text style={{ color: "#159447", fontSize: 11, fontWeight: "800" }}>Assign</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}