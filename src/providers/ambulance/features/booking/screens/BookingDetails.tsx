import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  acceptBooking,
  arrivedAtPickup,
  dropPatient,
  getCurrentBooking,
  getOpenOffers,
  pickupPatient,
  rejectBooking,
} from "../../../api/bookings";
import Header from "../components/Header";
import PrimaryButton from "../components/PrimaryButton";
import DangerButton from "../components/DangerButton";
import DetailRow from "../components/DetailRow";
import MapCard from "../components/MapCard";
import StatusPill from "../../bookings/components/StatusPill";
import { sendDriverLocation } from "../../../api/status";

export default function BookingDetails({
  route,
  navigation,
  serviceType,
}: any) {
  const BG = "#F5F8FC";
  const BLUE = "#1473E6";
  const GREEN = "#17B26A";
  const RED = "#E5484D";
  const MUTED = "#6B7890";
  const TEXT = "#10233F";

  const [booking, setBooking] = useState<any>(null);
  const [otp, setOtp] = useState("");
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadBooking();
  }, []);


  function getCoordinate(value: any) {
    const latitude = Number(value?.lat ?? value?.latitude);
    const longitude = Number(value?.lng ?? value?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }

  useEffect(() => {
    if (!booking) return;

    const shouldTrack = [
      "ACCEPTED",
      "EN_ROUTE_TO_PICKUP",
      "REACHED_PATIENT",
      "PATIENT_CONFIRMED",
    ].includes(
      String(booking.status),
    );

    if (!shouldTrack) return;

    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    async function startLocationTracking() {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Location Required",
          "Location permission is required while travelling to the patient or hospital.",
        );
        return;
      }

      const sendLocation = async (location: Location.LocationObject) => {
        const current = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (!mounted) return;

        setDriverLocation(current);

        try {
          await sendDriverLocation({
            lat: current.latitude,
            lng: current.longitude,
            heading: location.coords.heading ?? undefined,
          });
        } catch (error) {
          console.log("AMBULANCE LOCATION PING ERROR:", error);
        }
      };

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await sendLocation(current);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        sendLocation,
      );
    }

    startLocationTracking().catch((error) => {
      console.log("AMBULANCE LOCATION TRACKING ERROR:", error);
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [booking?.id, booking?.status]);

  async function loadBooking() {
    try {
      let response = await getCurrentBooking();

      if (response?.booking) {
        response = response.booking;
      }

      const requestedBookingId = String(route.params?.bookingId || "");

      if (requestedBookingId && String(response?.id || response?.bookingId || "") !== requestedBookingId) {
        const offers = await getOpenOffers();
        const items = Array.isArray(offers)
          ? offers
          : offers?.offers || offers?.bookings || [];
        response = items.find(
          (item: any) =>
            String(item?.id || item?.bookingId || "") === requestedBookingId,
        );
      } else if (!response?.id && !response?.bookingId) {
        const offers = await getOpenOffers();
        const items = Array.isArray(offers)
          ? offers
          : offers?.offers || offers?.bookings || [];
        response = items[0];
      }

      if (response?.booking) {
        response = response.booking;
      }

      if (response?.id || response?.bookingId) {
        const pickup = response?.pickup || response?.pickupLocation || {};
        const drop = response?.drop || response?.dropLocation || response?.hospital || {};
        const rawStatus = String(response?.status || "NEW").toUpperCase();

        setBooking({
          id: String(response?.id || response?.bookingId || ""),
          patient:
            response?.contactName ||
            response?.patientName ||
            response?.patient?.name ||
            "Patient",
          age: Number(response?.patient?.age || response?.age || 0),
          gender: response?.patient?.gender || response?.gender || "",
          serviceType: serviceType || "AMBULANCE",
          date:
            response?.appointmentDate ||
            response?.scheduledAt?.slice?.(0, 10) ||
            "Today",
          time:
            response?.startTime ||
            response?.scheduledAt?.slice?.(11, 16) ||
            "",
          patientAddress: pickup?.address || "Patient pickup location",
          hospital:
            drop?.name ||
            drop?.hospitalName ||
            response?.hospitalName ||
            "Hospital",
          hospitalAddress: drop?.address || "Hospital destination",
          pickupDistance: response?.pickupDistance ? `${response.pickupDistance} km` : "",
          hospitalDistance: response?.dropDistance ? `${response.dropDistance} km` : "",
          amount: Number(response?.fare || response?.amount || 0),
          notes: response?.patientNotes || response?.notes || "",
          status:
            rawStatus === "PICKED_UP"
              ? "PATIENT_CONFIRMED"
              : rawStatus === "PAYMENT_PENDING"
                ? "PAYMENT"
                : rawStatus,
          pickup,
          drop,
        });
      }
    } catch (error) {
      console.log("AMBULANCE BOOKING DETAILS ERROR:", error);
    }
  }

  async function accept() {
    try {
      const response = await acceptBooking(booking.id);
      const item = response?.booking || response;

      if (item?.id || item?.bookingId) {
        const pickup = item?.pickup || item?.pickupLocation || {};
        const drop = item?.drop || item?.dropLocation || item?.hospital || {};
        const rawStatus = String(item?.status || "ACCEPTED").toUpperCase();

        setBooking({
          ...booking,
          patientAddress: pickup?.address || booking.patientAddress,
          hospital: drop?.name || drop?.hospitalName || booking.hospital,
          hospitalAddress: drop?.address || booking.hospitalAddress,
          pickupDistance: item?.pickupDistance ? `${item.pickupDistance} km` : booking.pickupDistance,
          hospitalDistance: item?.dropDistance ? `${item.dropDistance} km` : booking.hospitalDistance,
          amount: Number(item?.fare || item?.amount || booking.amount || 0),
          status:
            rawStatus === "PICKED_UP"
              ? "PATIENT_CONFIRMED"
              : rawStatus === "PAYMENT_PENDING"
                ? "PAYMENT"
                : rawStatus,
        });
      } else {
        setBooking({ ...booking, status: "ACCEPTED" });
      }
    } catch (error: any) {
      Alert.alert("Unable to Accept", error?.message || "Please try again.");
    }
  }

  async function reject() {
    try {
      await rejectBooking(booking.id);
      Alert.alert(
        "Booking Rejected",
        "The patient booking has been rejected.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert("Unable to Reject", error?.message || "Please try again.");
    }
  }

  async function reachedPatient() {
    try {
      await arrivedAtPickup(booking.id);
      setBooking({ ...booking, status: "REACHED_PATIENT" });
    } catch (error: any) {
      Alert.alert("Unable to Update", error?.message || "Please try again.");
    }
  }

  async function verifyOTP() {
    if (!otp.trim()) {
      Alert.alert("OTP Required", "Please enter the OTP shared by the patient.");
      return;
    }

    try {
      const response = await pickupPatient(booking.id, otp.trim());
      const item = response?.booking || response;

      if (item?.id || item?.bookingId) {
        const pickup = item?.pickup || item?.pickupLocation || {};
        const drop = item?.drop || item?.dropLocation || item?.hospital || {};
        const rawStatus = String(item?.status || "ACCEPTED").toUpperCase();

        setBooking({
          ...booking,
          patientAddress: pickup?.address || booking.patientAddress,
          hospital: drop?.name || drop?.hospitalName || booking.hospital,
          hospitalAddress: drop?.address || booking.hospitalAddress,
          pickupDistance: item?.pickupDistance ? `${item.pickupDistance} km` : booking.pickupDistance,
          hospitalDistance: item?.dropDistance ? `${item.dropDistance} km` : booking.hospitalDistance,
          amount: Number(item?.fare || item?.amount || booking.amount || 0),
          status:
            rawStatus === "PICKED_UP"
              ? "PATIENT_CONFIRMED"
              : rawStatus === "PAYMENT_PENDING"
                ? "PAYMENT"
                : rawStatus,
        });
      } else {
        setBooking({ ...booking, status: "PATIENT_CONFIRMED" });
      }
    } catch (error: any) {
      Alert.alert("Invalid OTP", error?.message || "Please check the OTP.");
    }
  }

  async function hospitalReached() {
    try {
      await dropPatient(booking.id);
      setBooking({ ...booking, status: "PAYMENT" });
    } catch (error: any) {
      Alert.alert("Unable to Complete Drop", error?.message || "Please try again.");
    }
  }

  function paymentDone() {
    Alert.alert(
      "Trip Completed",
      `Payment of ₹${booking.amount} has been recorded.`,
      [
        {
          text: "Go to Dashboard",
          onPress: () => navigation.navigate("AmbulanceLayout"),
        },
      ],
    );
  }

  if (!booking) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: BG }}
        edges={["top"]}
      >
        <Header title="Booking Details" onBack={() => navigation.goBack()} />
        <View style={{ padding: 20 }}>
          <Text style={{ color: MUTED }}>Loading booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = booking.status || "NEW";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
      <Header
        title="Booking Details"
        onBack={() => navigation.goBack()}
        right={
          <StatusPill
            label={status.replace(/_/g, " ")}
            color={
              status === "COMPLETED"
                ? GREEN
                : status === "REJECTED"
                  ? RED
                  : BLUE
            }
          />
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 35 }}>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 28,
                backgroundColor: "#EAF3FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={27} color={BLUE} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>
                {booking.patient}
              </Text>
              <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>
                {booking.gender} • {booking.age} yrs
              </Text>
            </View>
          </View>

          <DetailRow
            icon={booking.serviceType === "AMBULANCE" ? "medkit-outline" : "car-outline"}
            title="Service"
            value={
              booking.serviceType === "AMBULANCE"
                ? "Ambulance Transport"
                : "Auto Patient Transport"
            }
          />
          <DetailRow
            icon="calendar-outline"
            title="Date & Time"
            value={`${booking.date}, ${booking.time}`}
          />
          <DetailRow
            icon="location-outline"
            title="Patient Pickup"
            value={booking.patientAddress}
          />
          <DetailRow
            icon="business-outline"
            title="Hospital"
            value={`${booking.hospital}, ${booking.hospitalAddress}`}
          />
          <DetailRow
            icon="cash-outline"
            title="Payment"
            value={`₹${booking.amount} • After hospital drop-off`}
          />

          <View
            style={{
              marginTop: 16,
              backgroundColor: "#F7F9FD",
              borderRadius: 12,
              padding: 13,
            }}
          >
            <Text style={{ color: TEXT, fontSize: 11, fontWeight: "900" }}>
              Trip Notes
            </Text>
            <Text style={{ color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 5 }}>
              {booking.notes}
            </Text>
          </View>
        </View>

        {status === "NEW" ? (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <DangerButton title="Reject" onPress={reject} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Accept" onPress={accept} />
            </View>
          </View>
        ) : null}

        {["ACCEPTED", "EN_ROUTE_TO_PICKUP"].includes(status) ? (
          <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}>
            <View style={{ backgroundColor: "#EAF3FF", borderRadius: 12, padding: 13, flexDirection: "row" }}>
              <Ionicons name="navigate-outline" size={19} color={BLUE} />
              <Text style={{ flex: 1, marginLeft: 8, color: BLUE, fontWeight: "800", fontSize: 11 }}>
                Navigate to the patient's live location. The hospital destination will be shown after OTP verification.
              </Text>
            </View>
            <MapCard
              type="patient"
              title="Patient Pickup"
              subtitle={`${booking.patientAddress} • ${booking.pickupDistance}`}
              destination={getCoordinate(booking.pickup)}
              driverLocation={driverLocation}
            />
            <View style={{ marginTop: 13 }}>
              <PrimaryButton
                title="I've Reached the Patient"
                icon="location"
                onPress={reachedPatient}
              />
            </View>
          </View>
        ) : null}

        {status === "REACHED_PATIENT" ? (
          <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}>
            <View style={{ backgroundColor: "#EAFBF3", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="checkmark-circle" size={19} color={GREEN} />
              <Text style={{ marginLeft: 8, color: "#117A4B", fontWeight: "900" }}>
                You have reached the patient
              </Text>
            </View>
            <Text style={{ color: TEXT, fontSize: 15, fontWeight: "900", marginTop: 17 }}>
              Patient OTP
            </Text>
            <Text style={{ color: MUTED, fontSize: 11, marginTop: 5 }}>
              Ask the patient for the 4-digit OTP. The hospital destination will unlock after verification.
            </Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              maxLength={4}
              keyboardType="number-pad"
              placeholder="Enter OTP"
              style={{ marginTop: 14, height: 54, borderWidth: 1, borderColor: "#D8E1ED", borderRadius: 12, textAlign: "center", fontSize: 22, fontWeight: "900", letterSpacing: 9 }}
            />
            <View style={{ marginTop: 12 }}>
              <PrimaryButton title="Confirm OTP & Start Trip" onPress={verifyOTP} />
            </View>
          </View>
        ) : null}

        {status === "PATIENT_CONFIRMED" ? (
          <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 16 }}>
            <View style={{ backgroundColor: "#EAF3FF", borderRadius: 12, padding: 13, flexDirection: "row" }}>
              <Ionicons name="navigate-outline" size={19} color={BLUE} />
              <Text style={{ flex: 1, marginLeft: 8, color: BLUE, fontWeight: "800", fontSize: 11 }}>
                OTP verified. Now navigate to the hospital destination.
              </Text>
            </View>
            <MapCard
              type="hospital"
              title={booking.hospital}
              subtitle={`${booking.hospitalAddress} • ${booking.hospitalDistance}`}
              destination={getCoordinate(booking.drop)}
              driverLocation={driverLocation}
            />
            <View style={{ marginTop: 13 }}>
              <PrimaryButton
                title="I've Reached the Hospital"
                icon="business"
                onPress={hospitalReached}
              />
            </View>
          </View>
        ) : null}

        {status === "PAYMENT" ? (
          <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 18 }}>
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: "#EAFBF3", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="checkmark" size={34} color={GREEN} />
              </View>
              <Text style={{ color: TEXT, fontSize: 19, fontWeight: "900", marginTop: 11 }}>
                Hospital Reached
              </Text>
              <Text style={{ color: MUTED, fontSize: 11, marginTop: 4, textAlign: "center" }}>
                Trip completed successfully. Collect/confirm the payment below.
              </Text>
            </View>
            <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: "#E7EDF5", paddingTop: 15, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, color: MUTED, fontSize: 12 }}>Trip Fare</Text>
              <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900" }}>
                ₹{booking.amount}
              </Text>
            </View>
            <View style={{ marginTop: 15 }}>
              <PrimaryButton
                title="Confirm Payment & Complete"
                icon="cash"
                onPress={paymentDone}
              />
            </View>
          </View>
        ) : null}

        {status === "COMPLETED" ? (
          <View style={{ marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 22, alignItems: "center" }}>
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: "#EAFBF3", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="checkmark" size={38} color={GREEN} />
            </View>
            <Text style={{ color: TEXT, fontSize: 19, fontWeight: "900", marginTop: 13 }}>
              Trip Completed
            </Text>
            <Text style={{ color: MUTED, fontSize: 11, textAlign: "center", marginTop: 5 }}>
              Hospital drop-off and payment are completed successfully.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
