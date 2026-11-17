import React from "react";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useECG } from "../../provider-state/store";
import { getBooking, acceptBooking, rejectBooking, onTheWay, reached, startBooking, completeBooking } from "../../../api/bookings";
import { generateOTP, verifyOTP, uploadReport } from "../../../api/ecg";
import { getPayment } from "../../../api/payment";
import { updateProviderLocation } from "../../../api/provider";
import { getRoute } from "../../../api/route";

import Header from "../components/Header";

import PrimaryButton from "../components/PrimaryButton";

import DetailRow from "../components/DetailRow";

import StatusPill from "../components/StatusPill";

const BG = "#F5F8FC";
const BLUE = "#1473E6";
const GREEN = "#17B26A";
const MUTED = "#6B7890";
const RED = "#E5484D";
const TEXT = "#10233F";

export default function BookingDetails({ route, navigation }: any) {
  const { provider, activeBooking, requests, refresh } = useECG();
  const [booking, setBooking] = React.useState<any>(activeBooking?.raw || requests.find((item) => item.id === route.params?.bookingId)?.raw || null);
  const [status, setStatus] = React.useState(String(booking?.status || "NEW").toUpperCase());
  const [otp, setOtp] = React.useState("");
  const [report, setReport] = React.useState<any>(null);
  const [payment, setPayment] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [providerLocation, setProviderLocation] = React.useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = React.useState<any[]>([]);
  const [routeInfo, setRouteInfo] = React.useState({ distance: "", duration: "" });
  const [mapError, setMapError] = React.useState("");

  const providerId = String(provider?.id || provider?.providerId || "");
  const bookingId = String(route.params?.bookingId || booking?.id || booking?.bookingId || "");

  React.useEffect(() => {
    const load = async () => {
      if (!bookingId) return;
      try {
        const response = await getBooking(bookingId);
        if (response) {
          setBooking(response);
          setStatus(String(response.status || "NEW").toUpperCase());
        }
      } catch (error) {
        console.log("ECG booking details error:", error);
      }
    };
    load();
  }, [bookingId]);

  const patient = booking?.patient || booking?.customer || booking?.citizen || {};
  const patientName = booking?.patientName || patient?.name || "Patient";
  const age = booking?.patientAge || patient?.age;
  const gender = booking?.patientSex || patient?.gender || "";
  const address = booking?.address || booking?.patientAddress || booking?.location?.address || "Patient location";
  const amount = Number(booking?.amount || booking?.price || booking?.totalAmount || 0);
  const notes = booking?.notes || booking?.patientNotes || "No additional notes.";
  const patientLatitude = Number(
    booking?.latitude || booking?.location?.latitude || booking?.patientLocation?.latitude || 0,
  );
  const patientLongitude = Number(
    booking?.longitude || booking?.location?.longitude || booking?.patientLocation?.longitude || 0,
  );

  React.useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startLocation = async () => {
      if (!["ACCEPTED", "ON_THE_WAY"].includes(status)) return;

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setMapError("Location permission is required to show your route.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const firstLocation = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setProviderLocation(firstLocation);
      if (providerId) {
        updateProviderLocation(providerId, firstLocation.latitude, firstLocation.longitude).catch((error) =>
          console.log("ECG provider location update error:", error),
        );
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 25,
          timeInterval: 10000,
        },
        (location) => {
          const nextLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setProviderLocation(nextLocation);
          if (providerId) {
            updateProviderLocation(providerId, nextLocation.latitude, nextLocation.longitude).catch((error) =>
              console.log("ECG provider location update error:", error),
            );
          }
        },
      );
    };

    startLocation().catch((error) => {
      console.log("ECG location error:", error);
      setMapError("Unable to get your current location.");
    });

    return () => {
      subscription?.remove();
    };
  }, [status, providerId]);

  React.useEffect(() => {
    const loadRoute = async () => {
      if (!providerLocation || !patientLatitude || !patientLongitude) {
        setRouteCoordinates([]);
        return;
      }

      try {
        setMapError("");
        const route = await getRoute(providerLocation, {
          latitude: patientLatitude,
          longitude: patientLongitude,
        });
        setRouteCoordinates(route.coordinates);
        setRouteInfo({ distance: route.distance, duration: route.duration });
      } catch (error: any) {
        console.log("ECG route error:", error);
        setMapError(error?.message || "Unable to load route.");
      }
    };

    loadRoute();
  }, [providerLocation, patientLatitude, patientLongitude]);

  if (!booking) return <SafeAreaView style={{ flex: 1, backgroundColor: BG }}><Header title="Booking Details" onBack={() => navigation.goBack()} /><View style={{ padding: 20 }}><Text style={{ color: TEXT }}>No booking available.</Text></View></SafeAreaView>;

  const accept = async () => {
    if (!providerId) return Alert.alert("Provider unavailable", "ECG provider ID was not found.");
    try {
      setLoading(true);
      const response = await acceptBooking(bookingId, providerId);
      setBooking(response || { ...booking, status: "ACCEPTED" });
      setStatus("ACCEPTED");
      await refresh();
    } catch (error: any) {
      Alert.alert("Unable to accept", error?.message || "The booking could not be accepted.");
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    if (!providerId) return Alert.alert("Provider unavailable", "ECG provider ID was not found.");
    try {
      setLoading(true);
      await rejectBooking(bookingId, providerId, "Provider unavailable");
      await refresh();
      Alert.alert("Booking Rejected", "The request has been rejected.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert("Unable to reject", error?.message || "The booking could not be rejected.");
    } finally {
      setLoading(false);
    }
  };

  const goOnTheWay = async () => {
    try {
      setLoading(true);
      const response = await onTheWay(bookingId, providerId);
      setBooking(response || { ...booking, status: "ON_THE_WAY" });
      setStatus("ON_THE_WAY");
    } catch (error: any) {
      Alert.alert("Unable to update", error?.message || "Could not update booking status.");
    } finally { setLoading(false); }
  };

  const markReached = async () => {
    try {
      setLoading(true);
      const response = await reached(bookingId, providerId);
      setBooking(response || { ...booking, status: "REACHED" });
      setStatus("REACHED");
      await generateOTP(bookingId).catch((error) => console.log("Generate OTP error:", error));
    } catch (error: any) {
      Alert.alert("Unable to update", error?.message || "Could not mark patient as reached.");
    } finally { setLoading(false); }
  };

  const confirmOTP = async () => {
    if (!otp.trim()) return Alert.alert("OTP required", "Enter the OTP provided by the patient.");
    try {
      setLoading(true);
      await verifyOTP(bookingId, otp.trim());
      const response = await startBooking(bookingId, providerId);
      setBooking(response || { ...booking, status: "STARTED" });
      setStatus("IN_PROGRESS");
    } catch (error: any) {
      Alert.alert("Invalid OTP", error?.message || "OTP verification failed.");
    } finally { setLoading(false); }
  };

  const selectReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];

      setReport({
        uri: file.uri,
        fileName: file.name || `ecg-report-${bookingId}`,
        fileType: file.mimeType || "application/octet-stream",
        fileSize: file.size || 0,
      });
    } catch (error: any) {
      Alert.alert("Unable to select report", error?.message || "Please try again.");
    }
  };

  const finish = async () => {
    if (!report) return Alert.alert("Upload report", "Please select the ECG report before completing the booking.");
    try {
      setLoading(true);
      await uploadReport(bookingId, { uri: report.uri, name: report.fileName, type: report.fileType });
      const completed = await completeBooking(bookingId, providerId);
      setBooking(completed || { ...booking, status: "COMPLETED" });
      setStatus("COMPLETED");
      const paymentResponse = await getPayment(bookingId).catch((error) => {
        console.log("ECG payment not available yet:", error);
        return null;
      });
      setPayment(paymentResponse);
      await refresh();
    } catch (error: any) {
      Alert.alert("Unable to complete", error?.message || "The ECG booking could not be completed.");
    } finally { setLoading(false); }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
    <Header title="Booking Details" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 55, height: 55, borderRadius: 28, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={27} color={BLUE} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>{patientName}</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{gender}{age ? ` • ${age} yrs` : ""}</Text></View>
          <StatusPill label={status.replaceAll("_", " ")} color={status === "COMPLETED" ? GREEN : BLUE} />
        </View>
        <DetailRow icon="pulse-outline" title="Service" value="ECG at Home" />
        <DetailRow icon="calendar-outline" title="Date & Time" value={`${booking?.appointmentDate || booking?.date || ""}${booking?.startTime || booking?.time ? `, ${booking?.startTime || booking?.time}` : ""}`} />
        <DetailRow icon="location-outline" title="Patient Location" value={address} />
        <DetailRow icon="cash-outline" title="Payment" value={amount ? `₹${amount}` : "Payment amount pending"} />
        <View style={{ marginTop: 16, backgroundColor: "#F7F9FD", borderRadius: 12, padding: 13 }}><Text style={{ color: TEXT, fontSize: 11, fontWeight: "900" }}>Patient Notes</Text><Text style={{ color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 5 }}>{notes}</Text></View>
      </View>

      {status === "NEW" || status === "PENDING" || status === "ASSIGNED" || status === "REQUESTED" || status === "CONFIRMED" ? <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}><Pressable disabled={loading} onPress={reject} style={{ flex: 1, height: 49, borderRadius: 12, borderWidth: 1, borderColor: RED, alignItems: "center", justifyContent: "center" }}><Text style={{ color: RED, fontWeight: "900" }}>Reject</Text></Pressable><View style={{ flex: 1 }}><PrimaryButton title={loading ? "Please wait..." : "Accept"} onPress={accept} disabled={loading} /></View></View> : null}

      {status === "ACCEPTED" ? <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}>
        <View style={{ backgroundColor: "#EAF3FF", borderRadius: 12, padding: 13, flexDirection: "row" }}>
          <Ionicons name="navigate-outline" size={19} color={BLUE} />
          <Text style={{ flex: 1, marginLeft: 8, color: BLUE, fontWeight: "800", fontSize: 11 }}>Go to the patient's location.</Text>
        </View>
        <MapView
          mapType="none"
          style={{ height: 260, borderRadius: 14, marginTop: 12 }}
          initialRegion={{
            latitude: patientLatitude || 13.0827,
            longitude: patientLongitude || 80.2707,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
          {providerLocation ? <Marker coordinate={providerLocation} title="You" /> : null}
          {patientLatitude && patientLongitude ? <Marker coordinate={{ latitude: patientLatitude, longitude: patientLongitude }} title="Patient" pinColor="red" /> : null}
          {routeCoordinates.length > 1 ? <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor={BLUE} /> : null}
        </MapView>
        {routeInfo.distance || routeInfo.duration ? <Text style={{ color: TEXT, fontSize: 11, fontWeight: "800", marginTop: 9 }}>{routeInfo.distance}{routeInfo.distance && routeInfo.duration ? " • " : ""}{routeInfo.duration}</Text> : null}
        {mapError ? <Text style={{ color: RED, fontSize: 10, marginTop: 7 }}>{mapError}</Text> : null}
        <View style={{ marginTop: 12 }}><PrimaryButton title="I'm On The Way" icon="navigate" onPress={goOnTheWay} disabled={loading} /></View>
      </View> : null}

      {status === "ON_THE_WAY" ? <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}>
        <View style={{ backgroundColor: "#EAF3FF", borderRadius: 12, padding: 13, flexDirection: "row" }}>
          <Ionicons name="navigate-outline" size={19} color={BLUE} />
          <Text style={{ flex: 1, marginLeft: 8, color: BLUE, fontWeight: "800", fontSize: 11 }}>You are on the way. Mark the patient as reached when you arrive.</Text>
        </View>
        <MapView
          mapType="none"
          style={{ height: 260, borderRadius: 14, marginTop: 12 }}
          initialRegion={{
            latitude: patientLatitude || 13.0827,
            longitude: patientLongitude || 80.2707,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
          {providerLocation ? <Marker coordinate={providerLocation} title="You" /> : null}
          {patientLatitude && patientLongitude ? <Marker coordinate={{ latitude: patientLatitude, longitude: patientLongitude }} title="Patient" pinColor="red" /> : null}
          {routeCoordinates.length > 1 ? <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor={BLUE} /> : null}
        </MapView>
        {routeInfo.distance || routeInfo.duration ? <Text style={{ color: TEXT, fontSize: 11, fontWeight: "800", marginTop: 9 }}>{routeInfo.distance}{routeInfo.distance && routeInfo.duration ? " • " : ""}{routeInfo.duration}</Text> : null}
        {mapError ? <Text style={{ color: RED, fontSize: 10, marginTop: 7 }}>{mapError}</Text> : null}
        <View style={{ marginTop: 12 }}><PrimaryButton title="I've Reached the Patient" icon="location" onPress={markReached} disabled={loading} /></View>
      </View> : null}

      {status === "REACHED" ? <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>Confirm Patient OTP</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 5 }}>Enter the OTP shared by the patient to start the ECG.</Text><TextInput value={otp} onChangeText={setOtp} maxLength={6} keyboardType="number-pad" placeholder="Enter OTP" style={{ marginTop: 14, height: 54, borderWidth: 1, borderColor: "#D8E1ED", borderRadius: 12, textAlign: "center", fontSize: 22, fontWeight: "900", letterSpacing: 9 }} /><View style={{ marginTop: 12 }}><PrimaryButton title={loading ? "Verifying..." : "Confirm OTP & Start ECG"} onPress={confirmOTP} disabled={loading} /></View></View> : null}

      {status === "IN_PROGRESS" || status === "STARTED" ? <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}><View style={{ backgroundColor: "#EAFBF3", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center" }}><Ionicons name="pulse" size={19} color={GREEN} /><Text style={{ marginLeft: 8, color: "#117A4B", fontWeight: "900" }}>ECG in progress</Text></View><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900", marginTop: 17 }}>Upload ECG Report</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>Select the completed ECG report before closing this booking.</Text><Pressable onPress={selectReport} style={{ marginTop: 13, borderWidth: 1, borderStyle: "dashed", borderColor: BLUE, borderRadius: 13, padding: 17, alignItems: "center", backgroundColor: "#F7FBFF" }}><Ionicons name={report ? "document-text" : "cloud-upload-outline"} size={28} color={BLUE} /><Text style={{ color: BLUE, fontWeight: "900", marginTop: 7 }}>{report ? report.fileName : "Tap to select report"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{report ? "Ready to submit" : "Image report"}</Text></Pressable><View style={{ marginTop: 13 }}><PrimaryButton title={loading ? "Completing..." : "Complete Work & Receive Payment"} onPress={finish} disabled={!report || loading} /></View></View> : null}

      {status === "COMPLETED" ? <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 22, alignItems: "center" }}><View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: "#EAFBF3", alignItems: "center", justifyContent: "center" }}><Ionicons name="checkmark" size={38} color={GREEN} /></View><Text style={{ color: TEXT, fontSize: 19, fontWeight: "900", marginTop: 13 }}>Work Completed</Text><Text style={{ color: MUTED, fontSize: 11, textAlign: "center", marginTop: 5 }}>The ECG report was uploaded successfully.</Text><View style={{ marginTop: 16, width: "100%", backgroundColor: "#F7F9FD", borderRadius: 12, padding: 14 }}><Text style={{ color: TEXT, fontWeight: "900" }}>Payment</Text><Text style={{ color: BLUE, fontSize: 20, fontWeight: "900", marginTop: 6 }}>{payment?.amount || amount ? `₹${payment?.amount || amount}` : "Pending"}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{payment?.status || "Payment status will update from the server."}</Text>{payment?.transactionId ? <Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>Transaction: {payment.transactionId}</Text> : null}</View></View> : null}
    </ScrollView>
  </SafeAreaView>;
}
