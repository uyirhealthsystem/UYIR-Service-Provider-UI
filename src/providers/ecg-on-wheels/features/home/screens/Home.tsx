import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useECG, type ECGBooking } from "../../provider-state/store";
import { updateAvailability } from "../../../api/provider";

const BLUE = "#0867E8";
const DARK = "#10233F";
const MUTED = "#6B7890";
const BG = "#F3F7FC";
const GREEN = "#16A765";

export default function Home({ navigation }: any) {
  const {
    provider,
    requests,
    activeBooking,
    completedBookings,
    dashboard,
    loading,
    error,
    refresh,
    acceptBooking,
    rejectBooking,
  } = useECG();
  const [checking, setChecking] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [available, setAvailable] = useState(Boolean(provider?.isAvailableForBooking ?? provider?.isAvailable ?? true));
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const checkNewBookings = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  };

  const toggleAvailability = async (next: boolean) => {
    const providerId = String(provider?.id || provider?.providerId || "");
    if (!providerId) {
      Alert.alert("Provider not ready", "Your provider profile is still loading. Please try again.");
      return;
    }
    setSavingAvailability(true);
    try {
      await updateAvailability(providerId, next);
      setAvailable(next);
      await refresh();
    } catch (e: unknown) {
      Alert.alert("Availability not updated", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSavingAvailability(false);
    }
  };

  const onAccept = async (booking: ECGBooking) => {
    setActionBookingId(booking.id);
    try {
      const accepted = await acceptBooking(booking);
      if (accepted) {
        await refresh();
        navigation.navigate("ECGBookingDetails", { bookingId: accepted.id });
      }
    } catch (e: unknown) {
      Alert.alert("Could not accept booking", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setActionBookingId(null);
    }
  };

  const onReject = (booking: ECGBooking) => {
    Alert.alert("Reject booking?", "This request will be declined.", [
      { text: "Keep booking", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        setActionBookingId(booking.id);
        try { await rejectBooking(booking); await refresh(); }
        catch (e: unknown) { Alert.alert("Could not reject booking", e instanceof Error ? e.message : "Please try again."); }
        finally { setActionBookingId(null); }
      } },
    ]);
  };

  const totalToday = Number(dashboard?.todayBookings ?? dashboard?.totalToday ?? requests.length + completedBookings.length + (activeBooking ? 1 : 0));
  const completedToday = Number(dashboard?.completedToday ?? dashboard?.todayCompleted ?? completedBookings.length);
  const todayPay = Number(dashboard?.todayEarnings ?? dashboard?.todayRevenue ?? 0);
  const request = requests[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ backgroundColor: BLUE, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={23} color={BLUE} /></View>
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Text style={{ color: "#DCEBFF", fontSize: 11 }}>Good morning</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 2 }}>{provider?.name || provider?.fullName || "ECG Provider"}</Text>
            </View>
            <Ionicons name="notifications-outline" size={23} color="#FFFFFF" />
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 23, fontWeight: "900", marginTop: 20 }}>ECG on Wheels</Text>
          <Text style={{ color: "#DCEBFF", fontSize: 12, marginTop: 4 }}>Mobile ECG Service Provider</Text>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 18, paddingVertical: 15, paddingHorizontal: 8, marginTop: 18, flexDirection: "row" }}>
            <Metric icon="calendar-outline" value={String(totalToday)} label="Today's jobs" />
            <Metric icon="checkmark-circle-outline" value={String(completedToday)} label="Completed" />
            <Metric icon="wallet-outline" value={`₹${todayPay.toLocaleString("en-IN")}`} label="Today's pay" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 17, padding: 15, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5ECF5" }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: available ? "#E7F9F0" : "#FFF2E5", alignItems: "center", justifyContent: "center" }}><Ionicons name="radio-outline" size={22} color={available ? GREEN : "#B76B13"} /></View>
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Text style={{ color: DARK, fontSize: 14, fontWeight: "900" }}>Available for bookings</Text>
              <Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{savingAvailability ? "Updating status…" : available ? "You can receive new ECG requests" : "You will not receive new requests"}</Text>
            </View>
            {savingAvailability ? <ActivityIndicator color={BLUE} /> : <Switch value={available} onValueChange={toggleAvailability} trackColor={{ false: "#CDD5E1", true: "#A6E8C6" }} thumbColor={available ? GREEN : "#FFFFFF"} />}
          </View>

          <View style={{ marginTop: 15, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#D8E5F5", backgroundColor: "#E6F0FA" }}>
            <View style={{ height: 185, overflow: "hidden", backgroundColor: "#E7F0E8" }}>
              <View style={{ position: "absolute", left: -25, top: 40, width: 340, height: 18, backgroundColor: "#FFFFFF", transform: [{ rotate: "-18deg" }] }} />
              <View style={{ position: "absolute", left: -12, top: 110, width: 350, height: 13, backgroundColor: "#FFFFFF", transform: [{ rotate: "17deg" }] }} />
              <View style={{ position: "absolute", left: 75, top: -25, width: 14, height: 260, backgroundColor: "#FFFFFF", transform: [{ rotate: "23deg" }] }} />
              <View style={{ position: "absolute", right: 45, top: -20, width: 11, height: 250, backgroundColor: "#FFFFFF", transform: [{ rotate: "-27deg" }] }} />
              <View style={{ position: "absolute", left: 18, top: 18, backgroundColor: "#FFFFFFE8", paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center" }}><Ionicons name="navigate-circle" size={18} color={BLUE} /><Text style={{ color: DARK, fontWeight: "800", fontSize: 11, marginLeft: 5 }}>Your location</Text></View>
              <View style={{ position: "absolute", left: "46%", top: 66, alignItems: "center" }}><View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#D5E7FF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" }}><Ionicons name="navigate" size={22} color={BLUE} /></View><View style={{ backgroundColor: BLUE, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 5 }}><Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "900" }}>You are here</Text></View></View>
              <View style={{ position: "absolute", left: 15, bottom: 12, right: 15, backgroundColor: "#FFFFFFE8", borderRadius: 10, padding: 9, flexDirection: "row", alignItems: "center" }}><Ionicons name="location-outline" size={16} color={BLUE} /><Text style={{ color: MUTED, fontSize: 10, marginLeft: 6, flex: 1 }}>Map preview · use navigation for live route</Text><Ionicons name="locate-outline" size={18} color={BLUE} /></View>
            </View>
          </View>

          <Pressable onPress={checkNewBookings} disabled={checking || loading} style={{ marginTop: 14, minHeight: 54, borderRadius: 15, backgroundColor: BLUE, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, opacity: checking || loading ? 0.75 : 1 }}>
            {checking || loading ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="refresh-circle-outline" size={22} color="#FFFFFF" />}
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900", marginLeft: 9 }}>{checking || loading ? "Checking bookings…" : "Check New Bookings"}</Text>
          </Pressable>
          <Text style={{ color: MUTED, fontSize: 10, textAlign: "center", marginTop: 7 }}>Tap to fetch the latest bookings from the API</Text>

          {error ? <View style={{ marginTop: 12, backgroundColor: "#FFF0F0", borderRadius: 12, padding: 12 }}><Text style={{ color: "#B42318", fontSize: 12 }}>{error}</Text></View> : null}

          {activeBooking ? (
            <View style={{ marginTop: 22 }}>
              <SectionTitle title="Active Booking" subtitle="Finish this booking before taking another" />
              <View style={cardStyle}>
                <View style={{ flexDirection: "row", alignItems: "center" }}><Avatar /><View style={{ flex: 1, marginLeft: 11 }}><Text style={nameStyle}>{activeBooking.patient}</Text><Text style={smallStyle}>{activeBooking.gender || "Patient"}{activeBooking.age ? ` · ${activeBooking.age} yrs` : ""}</Text></View><Pill label={activeBooking.status.replace(/_/g, " ")} green /></View>
                <Info icon="location-outline" text={activeBooking.address || "Patient address"} /><Info icon="time-outline" text={`${activeBooking.date || "Today"}${activeBooking.time ? ` · ${activeBooking.time}` : ""}`} />
                <Pressable onPress={() => navigation.navigate("ECGBookingDetails", { bookingId: activeBooking.id })} style={primaryButton}><Text style={primaryButtonText}>Continue Booking</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></Pressable>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 22 }}>
              <SectionTitle title="New Booking Request" subtitle={request ? "Review and respond to this request" : "New requests appear after you check bookings"} />
              {request ? <View style={cardStyle}>
                <View style={{ flexDirection: "row", alignItems: "center" }}><Avatar /><View style={{ flex: 1, marginLeft: 11 }}><Text style={nameStyle}>{request.patient}</Text><Text style={smallStyle}>{request.gender || "Patient"}{request.age ? ` · ${request.age} yrs` : ""}</Text></View><Pill label="NEW REQUEST" /></View>
                <Info icon="location-outline" text={request.address || "Patient address not provided"} /><Info icon="calendar-outline" text={`${request.date || "Date not provided"}${request.time ? ` · ${request.time}` : ""}`} /><Info icon="pulse-outline" text="ECG at Home" />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <Pressable disabled={actionBookingId === request.id} onPress={() => onReject(request)} style={{ flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: "#F04438", alignItems: "center", justifyContent: "center", flexDirection: "row", opacity: actionBookingId === request.id ? 0.6 : 1 }}><Ionicons name="close" size={19} color="#D92D20" /><Text style={{ color: "#D92D20", fontWeight: "900", marginLeft: 5 }}>Reject</Text></Pressable>
                  <Pressable disabled={actionBookingId === request.id} onPress={() => onAccept(request)} style={{ flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: BLUE, alignItems: "center", justifyContent: "center", flexDirection: "row", opacity: actionBookingId === request.id ? 0.6 : 1 }}>{actionBookingId === request.id ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="checkmark" size={19} color="#FFFFFF" /><Text style={{ color: "#FFFFFF", fontWeight: "900", marginLeft: 5 }}>Accept</Text></>}</Pressable>
                </View>
                <Pressable onPress={() => navigation.navigate("ECGBookingDetails", { bookingId: request.id })} style={{ paddingTop: 13, alignItems: "center" }}><Text style={{ color: BLUE, fontSize: 12, fontWeight: "800" }}>View booking details</Text></Pressable>
              </View> : <View style={[cardStyle, { alignItems: "center", paddingVertical: 25 }]}><View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="calendar-outline" size={26} color={BLUE} /></View><Text style={{ color: DARK, fontWeight: "900", fontSize: 15, marginTop: 12 }}>No new bookings found</Text><Text style={{ color: MUTED, fontSize: 11, textAlign: "center", marginTop: 5 }}>Tap Check New Bookings to fetch the latest requests.</Text></View>}
            </View>
          )}

          <View style={{ marginTop: 22 }}><SectionTitle title="Today's Summary" /><View style={[cardStyle, { flexDirection: "row", paddingVertical: 18 }]}><Summary icon="calendar-outline" label="Total jobs" value={String(totalToday)} /><Summary icon="checkmark-circle-outline" label="Completed" value={String(completedToday)} /><Summary icon="wallet-outline" label="Today's pay" value={`₹${todayPay.toLocaleString("en-IN")}`} /></View></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const cardStyle = { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E5ECF5" } as const;
const nameStyle = { color: DARK, fontSize: 14, fontWeight: "900" as const };
const smallStyle = { color: MUTED, fontSize: 11, marginTop: 4 };
const primaryButton = { marginTop: 16, minHeight: 48, backgroundColor: BLUE, borderRadius: 12, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8 };
const primaryButtonText = { color: "#FFFFFF", fontSize: 13, fontWeight: "900" as const };
function Metric({ icon, value, label }: { icon: any; value: string; label: string }) { return <View style={{ flex: 1, alignItems: "center" }}><Ionicons name={icon} size={19} color={BLUE} /><Text style={{ color: BLUE, fontSize: 16, fontWeight: "900", marginTop: 5 }}>{value}</Text><Text style={{ color: MUTED, fontSize: 9, marginTop: 3 }}>{label}</Text></View>; }
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) { return <View style={{ marginBottom: 10 }}><Text style={{ color: DARK, fontSize: 16, fontWeight: "900" }}>{title}</Text>{subtitle ? <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>{subtitle}</Text> : null}</View>; }
function Avatar() { return <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#EAF3FF", alignItems: "center", justifyContent: "center" }}><Ionicons name="person" size={24} color={BLUE} /></View>; }
function Pill({ label, green }: { label: string; green?: boolean }) { return <View style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: green ? "#E7F9F0" : "#EAF3FF" }}><Text style={{ color: green ? "#087443" : BLUE, fontSize: 9, fontWeight: "900" }}>{label}</Text></View>; }
function Info({ icon, text }: { icon: any; text: string }) { return <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}><Ionicons name={icon} size={16} color={BLUE} /><Text style={{ color: DARK, fontSize: 11, marginLeft: 9, flex: 1 }}>{text}</Text></View>; }
function Summary({ icon, label, value }: { icon: any; label: string; value: string }) { return <View style={{ flex: 1, alignItems: "center" }}><Ionicons name={icon} size={19} color={BLUE} /><Text style={{ color: DARK, fontWeight: "900", fontSize: 15, marginTop: 7 }}>{value}</Text><Text style={{ color: MUTED, fontSize: 9, marginTop: 4, textAlign: "center" }}>{label}</Text></View>; }
