import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { getMyProfile } from "../../../api/profile";
import { sendDriverLocation, updateDriverStatus } from "../../../api/status";
import { getMyTechnicians, updateTechnician } from "../../../api/technicians";
import MapCard from "../../booking/components/MapCard";

type Coordinate = { latitude: number; longitude: number };
type ScreenProps = { navigation?: any; route?: any };

const BLUE = "#1473E6";
const TEXT = "#10233F";
const MUTED = "#6B7890";
const GREEN = "#17B26A";
const RED = "#E5484D";

export default function Home({ navigation, route }: ScreenProps) {
  const serviceType: "AMBULANCE" | "AUTO" = route?.params?.serviceType || "AMBULANCE";
  const isAmbulance = serviceType === "AMBULANCE";
  const [available, setAvailable] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [techniciansAvailable, setTechniciansAvailable] = useState(false);
  const [technicianLoading, setTechnicianLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<Coordinate | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    void loadHome();
    return () => {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, []);

  function coordinate(value: any): Coordinate | null {
    const latitude = Number(value?.lat ?? value?.latitude);
    const longitude = Number(value?.lng ?? value?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return { latitude, longitude };
  }

  function normalizeStatus(value: any) {
    const status = String(value || "NEW").toUpperCase();
    if (["ARRIVED", "ARRIVED_AT_PICKUP", "REACHED_PATIENT", "AT_PICKUP"].includes(status)) return "ARRIVED_AT_PICKUP";
    if (["PICKED_UP", "PATIENT_CONFIRMED", "EN_ROUTE_TO_HOSPITAL", "TO_HOSPITAL"].includes(status)) return "EN_ROUTE_TO_HOSPITAL";
    if (["PAYMENT_PENDING", "PAYMENT"].includes(status)) return "PAYMENT_PENDING";
    return status;
  }

  function normalizeBooking(item: any) {
    const pickup = item?.pickup || item?.pickupLocation || {};
    const drop = item?.drop || item?.dropLocation || item?.hospital || {};
    return {
      ...item,
      id: String(item?.id || item?.bookingId || ""),
      patient: item?.contactName || item?.patientName || item?.patient?.name || "Patient",
      age: Number(item?.patient?.age || item?.age || 0),
      patientAddress: pickup?.address || "Patient pickup location",
      hospital: drop?.name || drop?.hospitalName || item?.hospitalName || "City Hospital",
      hospitalAddress: drop?.address || "Hospital destination",
      amount: Number(item?.fare || item?.amount || 0),
      emergencyType: item?.emergencyType || item?.type || "Ambulance Transport",
      pickup,
      drop,
      status: normalizeStatus(item?.status),
    };
  }

  function normalizeOffers(response: any) {
    const items = Array.isArray(response) ? response : response?.offers || response?.bookings || [];
    return items.map((item: any) => {
      const normalized = normalizeBooking(item);
      return {
        ...normalized,
        id: String(item?.id || item?.bookingId || normalized.id),
        pickupDistance: item?.distanceKm != null ? `${item.distanceKm} km` : "Pickup nearby",
      };
    }).filter((item: any) => Boolean(item.id));
  }

  async function loadHome() {
    try {
      const [profileResponse, currentResponse, technicianResponse] = await Promise.all([
        getMyProfile().catch(() => null),
        getCurrentBooking().catch(() => null),
        getMyTechnicians().catch(() => []),
      ]);
      const profileData = profileResponse?.data || profileResponse;
      setProfile(profileData);
      const technicianRows = Array.isArray(technicianResponse) ? technicianResponse : technicianResponse?.data || technicianResponse?.technicians || technicianResponse?.items || [];
      setTechnicians(Array.isArray(technicianRows) ? technicianRows : []);
      setTechniciansAvailable(Array.isArray(technicianRows) && technicianRows.length > 0 && technicianRows.some((item: any) => Boolean(item.available)));
      const online = Boolean(profileData?.online);
      setAvailable(online);
      const current = currentResponse?.booking || currentResponse;
      if (current?.id || current?.bookingId) {
        setBooking(normalizeBooking(current));
        setRequest(null);
        await startLocationTracking();
      } else {
        if (online) await startLocationTracking();
        else await getInitialLocation();
        if (online) {
          const offers = normalizeOffers(await getOpenOffers().catch(() => []));
          setRequest(offers[0] || null);
        }
      }
    } catch (error) {
      console.log("AMBULANCE HOME LOAD ERROR:", error);
      await getInitialLocation();
    }
  }

  async function getInitialLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setDriverLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (error) {
      console.log("AMBULANCE INITIAL LOCATION ERROR:", error);
    }
  }

  async function startLocationTracking() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Location Required", "Allow location access to use the live trip map.");
      return;
    }
    const updateLocation = async (location: Location.LocationObject) => {
      const current = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setDriverLocation(current);
      try {
        await sendDriverLocation({ lat: current.latitude, lng: current.longitude, heading: location.coords.heading ?? undefined });
      } catch (error) {
        console.log("AMBULANCE LOCATION PING ERROR:", error);
      }
    };
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    await updateLocation(current);
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
      updateLocation,
    );
  }

  async function changeAvailability(value: boolean) {
    try {
      if (value) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          Alert.alert("Location Required", "Allow location access before going online.");
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        await updateDriverStatus({ online: true, lat: latitude, lng: longitude });
        setDriverLocation({ latitude, longitude });
        setAvailable(true);
        await startLocationTracking();
      } else {
        await updateDriverStatus({ online: false });
        setAvailable(false);
        locationSubscription.current?.remove();
        locationSubscription.current = null;
      }
    } catch (error: any) {
      Alert.alert("Unable to change availability", error?.message || "Please try again.");
    }
  }

  async function changeTechnicianAvailability(value: boolean) {
    if (!technicians.length) {
      Alert.alert("No technicians added", "Open Profile → Technician Details to add a technician first.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open Profile", onPress: () => navigation?.navigate?.("Profile") },
      ]);
      return;
    }
    const missingId = technicians.some((item: any) => !String(item.id || item.technicianId || ""));
    if (missingId) {
      Alert.alert("Technician ID missing", "The technician list returned by the server is missing an ID. Availability cannot be updated safely.");
      return;
    }
    try {
      setTechnicianLoading(true);
      await Promise.all(technicians.map((item: any) => updateTechnician(String(item.id || item.technicianId), {
        fullName: item.fullName,
        phone: item.phone,
        qualification: item.qualification,
        certificationNumber: item.certificationNumber,
        available: value,
      })));
      setTechnicians((old: any[]) => old.map((item: any) => ({ ...item, available: value })));
      setTechniciansAvailable(value);
    } catch (error: any) {
      Alert.alert("Unable to update technician availability", error?.message || "Please try again.");
    } finally {
      setTechnicianLoading(false);
    }
  }

  async function checkNewBooking() {
    if (!available || booking || loading) return;
    try {
      setLoading(true);
      const offers = normalizeOffers(await getOpenOffers());
      setRequest(offers[0] || null);
      if (!offers.length) Alert.alert("No new booking", "There are no booking requests right now.");
    } catch (error: any) {
      Alert.alert("Unable to check bookings", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function accept() {
    if (!request) return;
    try {
      setLoading(true);
      const response = await acceptBooking(request.id);
      const item = response?.booking || response;
      setBooking(normalizeBooking({ ...request, ...(item || {}) }));
      setRequest(null);
      await startLocationTracking();
    } catch (error: any) {
      Alert.alert("Unable to accept booking", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!request) return;
    try {
      setLoading(true);
      await rejectBooking(request.id);
      setRequest(null);
    } catch (error: any) {
      Alert.alert("Unable to reject booking", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function reachedPatient() {
    if (!booking) return;
    try {
      setLoading(true);
      const response = await arrivedAtPickup(booking.id);
      const item = response?.booking || response;
      setBooking(normalizeBooking({ ...booking, ...(item || {}), status: item?.status || "ARRIVED_AT_PICKUP" }));
    } catch (error: any) {
      Alert.alert("Unable to update arrival", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!booking) return;
    if (!otp.trim()) {
      Alert.alert("OTP required", "Enter the OTP provided by the patient.");
      return;
    }
    try {
      setLoading(true);
      const response = await pickupPatient(booking.id, otp.trim());
      const item = response?.booking || response;
      setBooking(normalizeBooking({ ...booking, ...(item || {}), status: item?.status || "EN_ROUTE_TO_HOSPITAL" }));
      setOtp("");
    } catch (error: any) {
      Alert.alert("OTP verification failed", error?.message || "Check the OTP and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function reachedHospital() {
    if (!booking) return;
    try {
      setLoading(true);
      await dropPatient(booking.id);
      setBooking({ ...booking, status: "PAYMENT_PENDING" });
    } catch (error: any) {
      Alert.alert("Unable to complete drop-off", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function finishTrip() {
    Alert.alert("Trip dropped off", `Fare: ₹${booking?.amount || 0}. Payment status is managed by the booking service.`, [
      { text: "OK", onPress: () => { setBooking(null); setRequest(null); void getCurrentBooking().then((value) => { const item = value?.booking || value; if (item?.id || item?.bookingId) setBooking(normalizeBooking(item)); }).catch(() => undefined); } },
    ]);
  }

  function openMenuItem(name: string) {
    setMenuVisible(false);
    if (navigation?.navigate) navigation.navigate(name);
  }

  const toHospital = booking?.status === "EN_ROUTE_TO_HOSPITAL" || booking?.status === "PAYMENT_PENDING";
  const atPatient = booking?.status === "ARRIVED_AT_PICKUP";
  const destination = booking ? coordinate(toHospital ? booking.drop : booking.pickup) : null;
  const mapTitle = booking ? (toHospital ? booking.hospital : "Patient Pickup") : "Your Location";
  const mapSubtitle = booking ? (toHospital ? booking.hospitalAddress : booking.patientAddress) : (available ? "You are online" : "Driver location");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EAF1F8" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1 }}>
        <MapCard
          type={toHospital ? "hospital" : booking ? "patient" : "driver"}
          title={mapTitle}
          subtitle={mapSubtitle}
          destination={destination}
          driverLocation={driverLocation}
          fullScreen
        />

        <View style={{ position: "absolute", top: 10, left: 14, right: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => setMenuVisible(true)} style={circleButtonStyle} accessibilityLabel="Open menu">
            <Ionicons name="menu" size={24} color={TEXT} />
          </Pressable>
          <Pressable onPress={() => changeAvailability(!available)} style={{ backgroundColor: "#FFFFFF", borderRadius: 28, paddingVertical: 9, paddingLeft: 13, paddingRight: 8, flexDirection: "row", alignItems: "center", elevation: 5 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: available ? GREEN : "#9AA6B5", marginRight: 7 }} />
            <Text style={{ color: TEXT, fontSize: 12, fontWeight: "800", marginRight: 9 }}>{available ? "Available" : "Offline"}</Text>
            <View style={{ width: 42, height: 25, borderRadius: 14, backgroundColor: available ? BLUE : "#D1D8E1", justifyContent: "center", paddingHorizontal: 3, alignItems: available ? "flex-end" : "flex-start" }}>
              <View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: "#FFFFFF" }} />
            </View>
          </Pressable>
          <Pressable onPress={() => Alert.alert("Notifications", "You are all caught up.")} style={circleButtonStyle} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={21} color={TEXT} />
          </Pressable>
        </View>

        <View style={{ position: "absolute", top: 65, left: 14, right: 14, alignItems: "flex-end" }}>
          <Pressable onPress={() => changeTechnicianAvailability(!techniciansAvailable)} disabled={technicianLoading} style={{ backgroundColor: "#FFFFFF", borderRadius: 24, paddingVertical: 9, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", elevation: 4, opacity: technicianLoading ? 0.65 : 1 }}>
            {technicianLoading ? <ActivityIndicator size="small" color={BLUE} /> : <Ionicons name="people-outline" size={17} color={BLUE} />}
            <Text style={{ color: TEXT, fontSize: 11, fontWeight: "800", marginHorizontal: 7 }}>Technicians {techniciansAvailable ? "Available" : "Offline"}</Text>
            <View style={{ width: 36, height: 22, borderRadius: 12, backgroundColor: techniciansAvailable ? BLUE : "#D1D8E1", justifyContent: "center", paddingHorizontal: 3, alignItems: techniciansAvailable ? "flex-end" : "flex-start" }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#FFFFFF" }} />
            </View>
          </Pressable>
        </View>

        {!booking && !request ? (
          <View style={{ position: "absolute", right: 15, bottom: 28, gap: 10 }}>
            <Pressable onPress={getInitialLocation} style={circleButtonStyle} accessibilityLabel="Center map on driver">
              <Ionicons name="locate" size={22} color={BLUE} />
            </Pressable>
            <Pressable onPress={checkNewBooking} disabled={!available || loading} style={{ height: 48, paddingHorizontal: 16, borderRadius: 24, backgroundColor: available ? BLUE : "#D1DCE9", flexDirection: "row", alignItems: "center", justifyContent: "center", elevation: 5 }}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="refresh" size={19} color={available ? "#FFFFFF" : MUTED} />}
              <Text style={{ color: available ? "#FFFFFF" : MUTED, fontSize: 12, fontWeight: "900", marginLeft: 8 }}>Check New Booking</Text>
            </Pressable>
          </View>
        ) : null}

        {request && !booking ? (
          <View style={bottomSheetStyle}>
            <View style={sheetHandleStyle} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#FFE8E8", alignItems: "center", justifyContent: "center" }}><Ionicons name="medkit" size={19} color={RED} /></View>
                <Text style={{ color: TEXT, fontSize: 16, fontWeight: "900", marginLeft: 9 }}>New Booking Request</Text>
              </View>
              <View style={{ backgroundColor: "#EAF3FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }}><Text style={{ color: BLUE, fontSize: 10, fontWeight: "900" }}>URGENT</Text></View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={22} color={BLUE} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>{request.patient}</Text>
                <Text style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{request.age} yrs · {request.pickupDistance}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}><Ionicons name="location-outline" size={18} color={BLUE} /><Text numberOfLines={1} style={{ color: TEXT, fontSize: 12, marginLeft: 8, flex: 1 }}>{request.patientAddress}</Text></View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 9 }}><Ionicons name="medical-outline" size={18} color={BLUE} /><Text numberOfLines={1} style={{ color: TEXT, fontSize: 12, marginLeft: 8, flex: 1 }}>{request.emergencyType || (isAmbulance ? "Ambulance Transport" : "Auto Transport")}</Text></View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable disabled={loading} onPress={reject} style={{ flex: 1, height: 48, borderWidth: 1, borderColor: RED, borderRadius: 12, alignItems: "center", justifyContent: "center" }}><Text style={{ color: RED, fontWeight: "900" }}>Reject</Text></Pressable>
              <Pressable disabled={loading} onPress={accept} style={{ flex: 1, height: 48, backgroundColor: BLUE, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Accept Booking</Text>}</Pressable>
            </View>
          </View>
        ) : null}

        {booking ? (
          <View style={bottomSheetStyle}>
            <View style={sheetHandleStyle} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>{booking.status === "PAYMENT_PENDING" ? "Trip Completed" : toHospital ? "En route to Hospital" : atPatient ? "Arrived at Patient" : "En route to Patient"}</Text>
              <View style={{ backgroundColor: "#DDF8E9", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: "#188654", fontSize: 10, fontWeight: "900" }}>{booking.status === "PAYMENT_PENDING" ? "DROP-OFF" : atPatient ? "ARRIVED" : "LIVE"}</Text></View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 13 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={22} color={BLUE} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}>{booking.patient}</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{toHospital ? booking.hospital : booking.patientAddress}</Text></View>
              <Text style={{ color: TEXT, fontSize: 14, fontWeight: "900" }}>₹{booking.amount || 0}</Text>
            </View>
            {atPatient ? (
              <View style={{ marginTop: 15 }}>
                <Text style={{ color: TEXT, fontSize: 13, fontWeight: "900", marginBottom: 8 }}>Enter Patient OTP</Text>
                <Text style={{ color: MUTED, fontSize: 11, marginBottom: 10 }}>Ask the patient for the 6-digit OTP to start the trip.</Text>
                <TextInput value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="Enter OTP" placeholderTextColor="#8B97A8" style={{ height: 48, borderWidth: 1, borderColor: "#C8D9EE", borderRadius: 12, paddingHorizontal: 14, color: TEXT, fontSize: 18, letterSpacing: 7, textAlign: "center", fontWeight: "900" }} />
                <PrimaryAction title="Verify OTP" onPress={verifyOtp} loading={loading} />
              </View>
            ) : booking.status === "PAYMENT_PENDING" ? (
              <PrimaryAction title="Done" onPress={finishTrip} loading={loading} />
            ) : toHospital ? (
              <PrimaryAction title="I've Reached the Hospital" icon="location" onPress={reachedHospital} loading={loading} />
            ) : (
              <PrimaryAction title="I've Reached the Patient" icon="location" onPress={reachedPatient} loading={loading} />
            )}
          </View>
        ) : null}
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={{ flex: 1, flexDirection: "row", backgroundColor: "rgba(12,30,54,0.42)" }}>
          <View style={{ width: "82%", maxWidth: 330, minWidth: 250, height: "100%", backgroundColor: "#FFFFFF" }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 58, paddingHorizontal: 18, paddingBottom: 28 }}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#EDF1F6" }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={27} color={BLUE} /></View>
                <View style={{ marginLeft: 12, flex: 1 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: "900" }}>{profile?.fullName || "Driver"}</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{isAmbulance ? "Ambulance Provider" : "Auto Provider"}</Text></View>
                <Pressable onPress={() => setMenuVisible(false)} accessibilityRole="button" accessibilityLabel="Close menu"><Ionicons name="close" size={22} color={MUTED} /></Pressable>
              </View>
              {([
                ["home-outline", "Home"],
                ["calendar-outline", "Bookings"],
                ["wallet-outline", "Earnings"],
                ["person-outline", "Profile"],
              ] as const).map(([icon, name]) => (
                <Pressable key={name} onPress={() => openMenuItem(name)} style={{ minHeight: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 8, borderRadius: 12, backgroundColor: name === "Home" ? "#EAF3FF" : "#FFFFFF" }}>
                  <Ionicons name={icon} size={21} color={name === "Home" ? BLUE : MUTED} /><Text style={{ color: name === "Home" ? BLUE : TEXT, fontSize: 14, fontWeight: "800", marginLeft: 13 }}>{name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setMenuVisible(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PrimaryAction({ title, onPress, loading, icon }: { title: string; onPress: () => void; loading: boolean; icon?: any }) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={{ marginTop: 13, minHeight: 48, borderRadius: 12, backgroundColor: BLUE, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 12 }}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <><>{icon ? <Ionicons name={icon} size={18} color="#FFFFFF" /> : null}</><Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900", marginLeft: icon ? 8 : 0 }}>{title}</Text></>}
    </Pressable>
  );
}

const circleButtonStyle = {
  width: 42,
  height: 42,
  borderRadius: 22,
  backgroundColor: "#FFFFFF",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  elevation: 5,
};

const bottomSheetStyle = {
  position: "absolute" as const,
  left: 12,
  right: 12,
  bottom: 12,
  backgroundColor: "#FFFFFF",
  borderRadius: 22,
  paddingHorizontal: 17,
  paddingTop: 10,
  paddingBottom: 17,
  elevation: 8,
};

const sheetHandleStyle = {
  width: 38,
  height: 4,
  borderRadius: 3,
  backgroundColor: "#D8E0EA",
  alignSelf: "center" as const,
  marginBottom: 12,
};
