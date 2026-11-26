import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from "react-native-maps";
import { getIncomingPatient, type IncomingPatient } from "../../../api/hospital";
import { Banner, C, Card, Loading, Pill, Row, Screen } from "../../../components/ui";
import { fmtDateTime } from "../../../utils/format";

// The patient's phone reports about every 10 s while moving.
const POLL_MS = 5000;
const EDGE = { top: 70, right: 48, bottom: 48, left: 48 };
// No fix for this long: the phone may be off, out of signal, or location turned off.
const STALE_MIN = 3;
// Closer than this (straight line): the patient is at, or right outside, the hospital.
const ARRIVED_KM = 0.2;

const MODE: Record<string, string> = {
  OTHER_AMBULANCE: "Coming by another ambulance (108 / private)",
  OWN_WAY: "Coming on their own",
};

function Pin({ icon, color }: { icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.pin, { backgroundColor: color }]}>
      <Ionicons name={icon} size={16} color="#fff" />
    </View>
  );
}

const minutesAgo = (iso?: string | null) => (iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) : null);

/**
 * Where an emergency patient coming without an Uyir ambulance is: a live map of their phone's position and this
 * hospital, the straight-line distance and when the phone last reported. Polls while the emergency is open.
 */
export default function HospitalIncomingPatient({ navigation, route }: any) {
  const bookingId: string = route.params?.bookingId;
  const [data, setData] = useState<IncomingPatient | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [follow, setFollow] = useState(true);
  const map = useRef<MapView | null>(null);

  const load = useCallback(async () => {
    try { setData(await getIncomingPatient(bookingId)); setError(""); }
    catch (e: any) { setError(e?.message || "Unable to load the patient's location."); }
    finally { setLoading(false); }
  }, [bookingId]);

  const live = !data || data.status === "ACCEPTED";
  // Poll only while this screen is focused and the patient is still on the way.
  useFocusEffect(useCallback(() => {
    load();
    if (!live) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load, live]));

  const patient: LatLng | null = data?.location ? { latitude: data.location.lat, longitude: data.location.lng } : null;
  const hospital: LatLng | null = data?.hospital ? { latitude: data.hospital.lat, longitude: data.hospital.lng } : null;

  const points = useMemo(
    () => [patient, hospital].filter((p): p is LatLng => !!p),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patient?.latitude, patient?.longitude, hospital?.latitude, hospital?.longitude],
  );
  const frame = () => {
    if (points.length > 1) map.current?.fitToCoordinates(points, { edgePadding: EDGE, animated: true });
    else if (points.length === 1) map.current?.animateToRegion({ ...points[0], latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
  };
  useEffect(() => { if (follow) frame(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [points, follow]);

  const title = data?.patientName || route.params?.patientName || "Incoming patient";
  const back = () => navigation.goBack();

  if (loading && !data) {
    return <Screen title={title} subtitle="Incoming patient" onBack={back}><Loading text="Finding the patient…" /></Screen>;
  }
  if (!data) {
    return (
      <Screen title={title} subtitle="Incoming patient" onBack={back} onRefresh={load}>
        <Banner tone="danger" text={error || "The patient's location isn't available."} action={{ label: "Retry", onPress: load }} />
      </Screen>
    );
  }

  const seenAgo = minutesAgo(data.location?.updatedAt);
  const stale = seenAgo != null && seenAgo >= STALE_MIN;
  const arrived = data.distanceKm != null && data.distanceKm <= ARRIVED_KM;
  const kmh = data.location?.speed != null ? Math.round(data.location.speed * 3.6) : null;

  const headline = !live
    ? "The emergency is closed"
    : !data.location
      ? "Waiting for the patient's phone to share its location"
      : arrived
        ? "The patient is at your hospital"
        : stale
          ? `No update for ${seenAgo} min: the phone may be offline`
          : "Patient on the way to you";
  const tone = !live ? "gray" : arrived ? "success" : stale || !data.location ? "warn" : "danger";

  return (
    <Screen title={title} subtitle={data.emergencyType || "Incoming patient"} onBack={back} onRefresh={load}>
      {error ? <Banner tone="warn" text={`Showing the last known position. ${error}`} /> : null}

      <Card style={{ gap: 6 }}>
        <View style={styles.row}>
          <Pill text={data.arrivalMode ? MODE[data.arrivalMode] ?? data.arrivalMode : "On the way"} tone={tone} />
          {live && data.location && !stale ? <Text style={styles.live}>● LIVE</Text> : null}
        </View>
        <Text style={styles.headline}>{headline}</Text>
        {live && data.distanceKm != null && !arrived ? (
          <Text style={styles.eta}>
            {`${data.distanceKm.toFixed(1)} km`}
            <Text style={styles.etaSub}>{` away (straight line)${kmh != null && kmh > 3 ? ` · moving ${kmh} km/h` : ""}`}</Text>
          </Text>
        ) : null}
        {live && data.location ? <Text style={styles.seen}>{seenAgo === 0 ? "Updated just now" : `Updated ${seenAgo} min ago`}</Text> : null}
        {live && !arrived && data.distanceKm != null && data.distanceKm < 2 ? <Text style={styles.prepare}>Close by: get the emergency team ready at the entrance.</Text> : null}
      </Card>

      {live ? (
        <View style={styles.mapWrap}>
          <MapView
            ref={map}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={{ ...(patient ?? hospital ?? { latitude: 13.0827, longitude: 80.2707 }), latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            onMapReady={frame}
            onPanDrag={() => setFollow(false)}
            toolbarEnabled={false}
          >
            {hospital ? (
              <Marker coordinate={hospital} title="Your hospital" anchor={{ x: 0.5, y: 0.5 }}>
                <Pin icon="business" color={C.success} />
              </Marker>
            ) : null}
            {patient && data.location?.accuracy && data.location.accuracy > 30 ? (
              <Circle center={patient} radius={data.location.accuracy} strokeColor="rgba(217,45,32,0.4)" fillColor="rgba(217,45,32,0.08)" />
            ) : null}
            {patient ? (
              <Marker coordinate={patient} title={data.patientName || "Patient"} anchor={{ x: 0.5, y: 0.5 }}>
                <Pin icon={data.arrivalMode === "OTHER_AMBULANCE" ? "medkit" : "person"} color={stale ? C.muted : C.danger} />
              </Marker>
            ) : null}
            {patient && hospital ? <Polyline coordinates={[patient, hospital]} strokeColor={C.danger} strokeWidth={3} lineDashPattern={[8, 6]} /> : null}
          </MapView>
          {!patient ? (
            <View style={styles.chip} pointerEvents="none"><Text style={styles.chipText}>Waiting for the patient's location…</Text></View>
          ) : stale ? (
            <View style={[styles.chip, { backgroundColor: C.warnSoft }]} pointerEvents="none"><Text style={[styles.chipText, { color: C.warn }]}>{`Last seen ${seenAgo} min ago`}</Text></View>
          ) : null}
          {!follow ? (
            <Pressable style={styles.recenter} onPress={() => setFollow(true)} accessibilityLabel="Re-center map">
              <Ionicons name="locate" size={20} color={C.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Card>
        <Text style={styles.section}>Patient</Text>
        <Row label="Name" value={data.patientName} />
        <Row label="Emergency" value={data.emergencyType} />
        <Row label="Coming" value={data.arrivalMode ? MODE[data.arrivalMode] : undefined} />
        <Row label="Last location" value={data.location?.updatedAt ? fmtDateTime(data.location.updatedAt) : undefined} />
        {data.patientPhone ? (
          <Pressable style={styles.call} onPress={() => Linking.openURL(`tel:${data.patientPhone}`)}>
            <Ionicons name="call" size={16} color={C.primary} />
            <Text style={styles.callText}>{`Call ${data.patientPhone}`}</Text>
          </Pressable>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  live: { color: C.danger, fontWeight: "800", fontSize: 12 },
  headline: { fontSize: 16, fontWeight: "800", color: C.ink },
  eta: { fontSize: 26, fontWeight: "800", color: C.ink },
  etaSub: { fontSize: 13, fontWeight: "600", color: C.muted },
  seen: { fontSize: 12.5, color: C.muted },
  prepare: { fontSize: 13, fontWeight: "700", color: C.danger },
  section: { fontSize: 14, fontWeight: "800", color: C.ink, marginBottom: 6 },
  mapWrap: { height: 300, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.line, backgroundColor: C.graySoft, marginBottom: 12 },
  pin: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  chip: { position: "absolute", top: 10, left: 10, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.line },
  chipText: { fontSize: 12.5, fontWeight: "700", color: C.ink },
  recenter: { position: "absolute", right: 10, bottom: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  call: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingVertical: 8 },
  callText: { color: C.primary, fontWeight: "700", fontSize: 14 },
});
