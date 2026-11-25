import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from "react-native-maps";
import { getIncomingAmbulance, type IncomingAmbulance } from "../../../api/hospital";
import { Banner, Button, C, Card, Loading, Pill, Row, Screen } from "../../../components/ui";
import { fmtDateTime } from "../../../utils/format";

// The ambulance service updates the driver's position every few seconds.
const POLL_MS = 5000;
const LIVE = ["SEARCHING", "EN_ROUTE_TO_PICKUP", "ARRIVED", "PICKED_UP"];
const EDGE = { top: 70, right: 48, bottom: 48, left: 48 };

const STATUS: Record<string, { text: string; tone: "primary" | "success" | "warn" | "danger" | "gray" }> = {
  SEARCHING: { text: "Finding the nearest ambulance for the patient", tone: "warn" },
  EN_ROUTE_TO_PICKUP: { text: "Ambulance on the way to the patient", tone: "primary" },
  ARRIVED: { text: "Ambulance has reached the patient", tone: "primary" },
  PICKED_UP: { text: "Patient on board, coming to you", tone: "danger" },
  PAYMENT_PENDING: { text: "Patient dropped at your hospital", tone: "success" },
  COMPLETED: { text: "Patient dropped at your hospital", tone: "success" },
  CANCELLED: { text: "The ambulance was cancelled", tone: "gray" },
  NO_AMBULANCE_FOUND: { text: "No ambulance was free near the patient", tone: "gray" },
};

function Pin({ icon, color }: { icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.pin, { backgroundColor: color }]}>
      <Ionicons name={icon} size={16} color="#fff" />
    </View>
  );
}

/**
 * Where the ambulance bringing an emergency patient is: a live map (ambulance, patient's pickup, this hospital),
 * the ETA and the crew. Polls while the ride is under way; stops once it has ended.
 */
export default function HospitalIncomingAmbulance({ navigation, route }: any) {
  const bookingId: string = route.params?.bookingId;
  const [data, setData] = useState<IncomingAmbulance | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [follow, setFollow] = useState(true);
  const map = useRef<MapView | null>(null);

  const load = useCallback(async () => {
    try { setData(await getIncomingAmbulance(bookingId)); setError(""); }
    catch (e: any) { setError(e?.message || "Unable to load the ambulance."); }
    finally { setLoading(false); }
  }, [bookingId]);

  const live = !data || LIVE.includes(data.status);
  // Poll only while this screen is focused and the ride is still on the road.
  useFocusEffect(useCallback(() => {
    load();
    if (!live) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load, live]));

  const ambulance: LatLng | null = data?.location ? { latitude: data.location.lat, longitude: data.location.lng } : null;
  const pickup: LatLng | null = data?.pickup ? { latitude: data.pickup.lat, longitude: data.pickup.lng } : null;
  const hospital: LatLng | null = data?.destination ? { latitude: data.destination.lat, longitude: data.destination.lng } : null;
  const onBoard = !!data?.patientOnBoard;
  const target = onBoard ? hospital : pickup;

  const points = useMemo(
    () => [ambulance, onBoard ? null : pickup, hospital].filter((p): p is LatLng => !!p),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ambulance?.latitude, ambulance?.longitude, pickup?.latitude, pickup?.longitude, hospital?.latitude, hospital?.longitude, onBoard],
  );
  const frame = () => {
    if (points.length > 1) map.current?.fitToCoordinates(points, { edgePadding: EDGE, animated: true });
    else if (points.length === 1) map.current?.animateToRegion({ ...points[0], latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
  };
  useEffect(() => { if (follow) frame(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [points, follow]);

  const title = data?.patientName || route.params?.patientName || "Incoming ambulance";
  const back = () => navigation.goBack();

  if (loading && !data) {
    return <Screen title={title} subtitle="Incoming ambulance" onBack={back}><Loading text="Finding the ambulance…" /></Screen>;
  }
  if (!data) {
    return (
      <Screen title={title} subtitle="Incoming ambulance" onBack={back} onRefresh={load}>
        <Banner tone="danger" text={error || "No ambulance is linked to this emergency."} action={{ label: "Retry", onPress: load }} />
      </Screen>
    );
  }

  const st = STATUS[data.status] ?? { text: data.status, tone: "gray" as const };
  const seenAgo = data.location ? Math.round((Date.now() - new Date(data.location.updatedAt).getTime()) / 60000) : null;

  return (
    <Screen title={title} subtitle={data.emergencyType || "Incoming ambulance"} onBack={back} onRefresh={load}>
      {error ? <Banner tone="warn" text={`Showing the last known position. ${error}`} /> : null}

      <Card style={{ gap: 6 }}>
        <View style={styles.row}>
          <Pill text={data.status.replace(/_/g, " ")} tone={st.tone} />
          {live ? <Text style={styles.live}>● LIVE</Text> : null}
        </View>
        <Text style={styles.headline}>{st.text}</Text>
        {data.etaMinutes != null ? (
          <Text style={styles.eta}>
            {`${data.etaMinutes} min`}
            <Text style={styles.etaSub}>{` · ${data.distanceKm?.toFixed(1)} km ${onBoard ? "to your hospital" : "to the patient"}`}</Text>
          </Text>
        ) : null}
        {onBoard ? <Text style={styles.prepare}>Get the emergency team ready at the entrance.</Text> : null}
      </Card>

      {live ? (
        <View style={styles.mapWrap}>
          <MapView
            ref={map}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={{ ...(ambulance ?? pickup ?? hospital ?? { latitude: 13.0827, longitude: 80.2707 }), latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            onMapReady={frame}
            onPanDrag={() => setFollow(false)}
            toolbarEnabled={false}
          >
            {pickup && !onBoard ? (
              <Marker coordinate={pickup} title="Patient" description={data.pickup?.address ?? undefined} anchor={{ x: 0.5, y: 0.5 }}>
                <Pin icon="person" color={C.primary} />
              </Marker>
            ) : null}
            {hospital ? (
              <Marker coordinate={hospital} title="Your hospital" anchor={{ x: 0.5, y: 0.5 }}>
                <Pin icon="business" color={C.success} />
              </Marker>
            ) : null}
            {ambulance ? (
              <Marker coordinate={ambulance} title={data.driver?.plateNumber || "Ambulance"} anchor={{ x: 0.5, y: 0.5 }} flat>
                <Pin icon="medkit" color={C.danger} />
              </Marker>
            ) : null}
            {ambulance && target ? <Polyline coordinates={[ambulance, target]} strokeColor={C.danger} strokeWidth={3} lineDashPattern={[8, 6]} /> : null}
          </MapView>
          {!ambulance ? (
            <View style={styles.chip} pointerEvents="none"><Text style={styles.chipText}>Waiting for the ambulance's location…</Text></View>
          ) : seenAgo != null && seenAgo >= 2 ? (
            <View style={[styles.chip, { backgroundColor: C.warnSoft }]} pointerEvents="none"><Text style={[styles.chipText, { color: C.warn }]}>{`Last seen ${seenAgo} min ago`}</Text></View>
          ) : null}
          {!follow ? (
            <Pressable style={styles.recenter} onPress={() => setFollow(true)} accessibilityLabel="Re-center map">
              <Ionicons name="locate" size={20} color={C.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {data.driver ? (
        <Card>
          <Text style={styles.section}>Ambulance crew</Text>
          <Row label="Driver" value={data.driver.name} />
          <Row label="Vehicle" value={data.driver.plateNumber} />
          <Row label="Type" value={data.driver.ambulanceType || data.ambulanceType || undefined} />
          {live ? <Button style={{ marginTop: 10 }} variant="secondary" icon="call" title="Call driver" onPress={() => Linking.openURL(`tel:${data.driver!.phone}`)} /> : null}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.section}>Patient</Text>
        <Row label="Name" value={data.patientName} />
        <Row label="Emergency" value={data.emergencyType} />
        <Row label="Picked up from" value={data.pickup?.address || undefined} />
        <Row label="Ambulance booked" value={data.bookedAt ? fmtDateTime(data.bookedAt) : undefined} />
        {data.patientPhone ? <Button style={{ marginTop: 10 }} variant="ghost" icon="call-outline" title={`Call ${data.patientPhone}`} onPress={() => Linking.openURL(`tel:${data.patientPhone}`)} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  live: { color: C.danger, fontWeight: "800", fontSize: 12 },
  headline: { fontSize: 16, fontWeight: "800", color: C.ink },
  eta: { fontSize: 26, fontWeight: "800", color: C.ink },
  etaSub: { fontSize: 13, fontWeight: "600", color: C.muted },
  prepare: { fontSize: 13, fontWeight: "700", color: C.danger },
  section: { fontSize: 14, fontWeight: "800", color: C.ink, marginBottom: 6 },
  mapWrap: { height: 300, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.line, backgroundColor: C.graySoft, marginBottom: 12 },
  pin: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  chip: { position: "absolute", top: 10, left: 10, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.line },
  chipText: { fontSize: 12.5, fontWeight: "700", color: C.ink },
  recenter: { position: "absolute", right: 10, bottom: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
});
