import { useFocusEffect, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";

import { getBucket } from "../../../api/bucket";
import { getMyProfile } from "../../../api/profile";
import { updateProHospitalStatus, uploadProHospitalImages } from "../../../api/onboarding";

type VisitPhoto = { uri: string; latitude: number; longitude: number; capturedAt: string; city: string; district: string; pincode: string; state: string; country: string };
const BLUE = "#1756D9";
const BG = "#F4F7FC";
const INK = "#17233D";
const MUTED = "#71809A";
const MAX_BYTES = 100 * 1024;

export default function HospitalVisit({ navigation }: any) {
  const route = useRoute<any>();
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visitStarted, setVisitStarted] = useState(false);
  const [hospitalPhoto, setHospitalPhoto] = useState<VisitPhoto | null>(null);
  const [proPhoto, setProPhoto] = useState<VisitPhoto | null>(null);
  const [status, setStatus] = useState<"interested" | "notInterested" | "">("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingPhoto, setWorkingPhoto] = useState(false);
  const [error, setError] = useState("");
  const hospitalShot = useRef<ViewShot>(null);
  const proShot = useRef<ViewShot>(null);

  const loadHospital = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const profileResponse = await getMyProfile();
      const profile = profileResponse?.data || profileResponse || {};
      const proId = profile?.proId || profile?.pro?.proId || profile?.id;
      if (!proId) throw new Error("PRO ID not found. Please sign in again.");
      const response = await getBucket(proId);
      const hospitals = Array.isArray(response?.data?.hospitals) ? response.data.hospitals : Array.isArray(response?.data) ? response.data : Array.isArray(response?.hospitals) ? response.hospitals : [];
      const selected = hospitals.find((item: any) => item.proHospitalId === route.params?.proHospitalId);
      setHospital(selected || null);
    } catch (e: any) {
      setError(e?.message || "Unable to load hospital details.");
      setHospital(null);
    } finally { setLoading(false); }
  }, [route.params?.proHospitalId]);

  useFocusEffect(useCallback(() => { loadHospital(); }, [loadHospital]));

  const startVisit = () => {
    setVisitStarted(true);
    setError("");
  };

  const capturePhoto = async (type: "hospital" | "pro") => {
    try {
      setWorkingPhoto(true);
      setError("");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error("Camera permission is required to capture visit proof.");
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== "granted") throw new Error("Location permission is required. Enable location to add GPS coordinates to the visit photo.");
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      // Resolve GPS coordinates to readable address details before stamping the photo.
      let address: any = {};
      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        address = addresses?.[0] || {};
      } catch (geocodeError) {
        console.warn("Visit photo reverse-geocode failed", geocodeError);
      }
      // Expo may omit postcode/city for some GPS fixes. Try a reverse-geocoding fallback.
      if (!address.postalCode || !(address.city || address.district || address.subregion)) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.coords.latitude}&lon=${location.coords.longitude}&zoom=18&addressdetails=1`, { headers: { Accept: "application/json" } });
          const result = await response.json();
          const parts = result?.address || {};
          address = {
            ...address,
            city: address.city || parts.city || parts.town || parts.village || parts.municipality || parts.suburb,
            district: address.district || parts.county || parts.state_district || parts.city_district,
            postalCode: address.postalCode || parts.postcode,
            region: address.region || parts.state,
            country: address.country || parts.country,
          };
        } catch (geocodeFallbackError) {
          console.warn("Visit photo address fallback failed", geocodeFallbackError);
        }
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
      if (result.canceled || !result.assets[0]?.uri) return;
      const photo: VisitPhoto = {
        uri: result.assets[0].uri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        capturedAt: new Date().toISOString(),
        city: String(address.city || address.subregion || address.district || address.region || "Not detected"),
        district: String(address.district || address.subregion || address.city || "Not detected"),
        pincode: String(address.postalCode || "Not detected"),
        state: String(address.region || "Tamil Nadu"),
        country: String(address.country || "India"),
      };
      if (type === "hospital") setHospitalPhoto(photo); else setProPhoto(photo);
    } catch (e: any) {
      setError(e?.message || "Could not capture photo. Please try again.");
    } finally { setWorkingPhoto(false); }
  };

  const compressUnder100KB = async (uri: string) => {
    let width = 1280;
    let quality = 0.72;
    let result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], { compress: quality, format: ImageManipulator.SaveFormat.JPEG });
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const info = await fetch(result.uri).then((response) => response.blob());
      if (info.size > 0 && info.size <= MAX_BYTES) return result.uri;
      if (quality > 0.28) quality -= 0.09;
      else { width = Math.max(480, Math.round(width * 0.82)); quality = 0.48; }
      result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], { compress: quality, format: ImageManipulator.SaveFormat.JPEG });
    }
    const finalSize = await fetch(result.uri).then((response) => response.blob()).then((blob) => blob.size);
    if (finalSize > MAX_BYTES) throw new Error("Photo could not be compressed below 100 KB. Please retake it in better lighting.");
    return result.uri;
  };

  const captureStampedPhoto = async (ref: any, photo: VisitPhoto) => {
    const stampedUri = await captureRef(ref.current, { format: "jpg", quality: 0.95, result: "tmpfile" });
    return compressUnder100KB(stampedUri || photo.uri);
  };

  const uploadVisitProof = async () => {
    if (!hospitalPhoto || !proPhoto) throw new Error("Capture both required photos before continuing.");
    const [first, second] = await Promise.all([
      captureStampedPhoto(hospitalShot, hospitalPhoto),
      captureStampedPhoto(proShot, proPhoto),
    ]);
    await uploadProHospitalImages(route.params?.proHospitalId, first, second);
  };

  const handleInterested = async () => {
    if (saving) return;
    try {
      setSaving(true); setError("");
      await uploadVisitProof();
      navigation.navigate("HospitalOnboarding", {
        proHospitalId: route.params?.proHospitalId,
        hospitalPoolId: hospital?.hospitalPoolId || route.params?.hospitalPoolId,
        hospital,
      });
    } catch (e: any) { setError(e?.message || "Unable to continue. Please try again."); }
    finally { setSaving(false); }
  };

  const handleNotInterested = async () => {
    if (saving) return;
    if (!reason.trim()) { setError("Please enter the reason the hospital is not interested."); return; }
    try {
      setSaving(true); setError("");
      await uploadVisitProof();
      await updateProHospitalStatus(route.params?.proHospitalId, { status: "HOSPITAL_REJECTED", reason: reason.trim() });
      Alert.alert("Visit Completed", "The visit photos and hospital response have been submitted.", [{ text: "Done", onPress: () => navigation.navigate("ProLayout") }]);
    } catch (e: any) { setError(e?.message || "Unable to complete visit. Please try again."); }
    finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={BLUE} /><Text style={styles.loadingText}>Loading hospital details…</Text></SafeAreaView>;
  if (!hospital) return <SafeAreaView style={styles.center}><Text style={styles.errorText}>{error || "Hospital not found"}</Text><Pressable style={styles.primaryButton} onPress={loadHospital}><Text style={styles.primaryText}>Try again</Text></Pressable></SafeAreaView>;

  const hospitalName = String(hospital?.hospitalPool?.name || hospital?.name || "Hospital").replace(/\r?\n/g, " ");
  const hospitalAddress = hospital?.hospitalPool?.address || hospital?.address || hospital?.hospitalPool?.districtId || hospital?.districtId || "Address unavailable";
  const photoCount = Number(!!hospitalPhoto) + Number(!!proPhoto);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.title}>Hospital visit</Text><Text style={styles.subtitle}>Visit proof first, then record the hospital's response</Text></View>
        </View>

        <View style={styles.hospitalCard}>
          <View style={styles.hospitalIcon}><Text style={{ fontSize: 30 }}>✚</Text></View>
          <View style={{ flex: 1 }}><Text style={styles.hospitalName}>{hospitalName}</Text><Text style={styles.address}>{hospitalAddress}</Text><Text style={styles.bucketTag}>BUCKET HOSPITAL</Text></View>
        </View>

        {!visitStarted ? <View style={styles.introCard}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
          <Text style={styles.sectionTitle}>Start your hospital visit</Text>
          <Text style={styles.bodyText}>First capture two on-site photos. Each photo will show the detected city, district, pincode and visit time, then be compressed to under 100 KB before upload.</Text>
          <View style={styles.requirementRow}><Text style={styles.check}>✓</Text><Text style={styles.requirement}>Hospital exterior photo</Text></View>
          <View style={styles.requirementRow}><Text style={styles.check}>✓</Text><Text style={styles.requirement}>PRO at the hospital photo</Text></View>
          <Pressable onPress={startVisit} style={styles.primaryButton}><Text style={styles.primaryText}>Start Visit  →</Text></Pressable>
        </View> : <>
          <View style={styles.progressRow}><View style={styles.progressActive} /><View style={styles.progressActive} /><View style={styles.progressInactive} /><Text style={styles.progressLabel}>STEP 1 OF 2 · VISIT PROOF</Text></View>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeadingRow}><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>Capture two photos</Text><Text style={styles.bodyText}>Photos must be taken at the hospital with location enabled.</Text></View><Text style={styles.counter}>{photoCount}/2</Text></View>
            <PhotoCapture title="Hospital exterior" description="Show the hospital building or name board" photo={hospitalPhoto} onPress={() => capturePhoto("hospital")} shotRef={hospitalShot} busy={workingPhoto} />
            <PhotoCapture title="PRO at the hospital" description="A clear photo of you at this hospital" photo={proPhoto} onPress={() => capturePhoto("pro")} shotRef={proShot} busy={workingPhoto} />
            <View style={styles.infoBanner}><Text style={styles.infoIcon}>ⓘ</Text><Text style={styles.infoText}>City, district, pincode and visit time are stamped on each photo. GPS coordinates are retained as location data, not printed on the image. Photos are compressed to under 100 KB before upload.</Text></View>
          </View>

          {photoCount === 2 && <View style={styles.sectionCard}>
            <View style={styles.sectionHeadingRow}><View style={[styles.stepBadge, { backgroundColor: "#E6F7EE" }]}><Text style={[styles.stepBadgeText, { color: "#14804A" }]}>2</Text></View><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>Is the hospital interested?</Text><Text style={styles.bodyText}>Choose the response after speaking with the hospital.</Text></View></View>
            <View style={styles.responseRow}>
              <ResponseButton label="Yes, interested" sublabel="Continue onboarding" active={status === "interested"} color="#16834B" onPress={() => { setStatus("interested"); setError(""); }} />
              <ResponseButton label="Not interested" sublabel="Record a reason" active={status === "notInterested"} color="#C24141" onPress={() => { setStatus("notInterested"); setError(""); }} />
            </View>
            {status === "notInterested" && <View style={{ marginTop: 16 }}><Text style={styles.fieldLabel}>Reason for not interested *</Text><TextInput value={reason} onChangeText={(value) => { setReason(value); setError(""); }} placeholder="Example: Not planning to join at this time" placeholderTextColor="#98A2B3" multiline textAlignVertical="top" style={styles.reasonInput} /></View>}
            {status === "interested" && <View style={styles.nextInfo}><Text style={styles.check}>✓</Text><Text style={styles.infoText}>Next: enter hospital details, facilities, doctor details, then review and submit.</Text></View>}
          </View>}
        </>}

        {!!error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}
        {visitStarted && photoCount === 2 && status !== "" && <Pressable disabled={saving || workingPhoto} onPress={status === "interested" ? handleInterested : handleNotInterested} style={[styles.primaryButton, { marginTop: 14, opacity: saving ? 0.7 : 1 }]}>{saving ? <><ActivityIndicator color="#FFFFFF" /><Text style={[styles.primaryText, { marginLeft: 8 }]}>Compressing & submitting…</Text></> : <Text style={styles.primaryText}>{status === "interested" ? "Continue to onboarding  →" : "Submit visit & finish  →"}</Text>}</Pressable>}
        {visitStarted && <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}><Text style={styles.cancelText}>Save nothing · Go back</Text></Pressable>}
      </ScrollView>
    </SafeAreaView>
  );
}

function PhotoCapture({ title, description, photo, onPress, shotRef, busy }: any) {
  return <View style={styles.photoBlock}>
    {photo ? <ViewShot ref={shotRef} options={{ format: "jpg", quality: 0.95 }} style={styles.photoShot}>
      <Image source={{ uri: photo.uri }} resizeMode="cover" style={styles.photoImage} />
      <View style={styles.gpsOverlay}><Text style={styles.gpsTitle}>UYIR · HOSPITAL VISIT PROOF</Text><Text style={styles.gpsText}>City: {photo.city}  ·  District: {photo.district}</Text><Text style={styles.gpsText}>Pincode: {photo.pincode}  ·  {photo.state}, {photo.country}</Text><Text style={styles.gpsText}>{new Date(photo.capturedAt).toLocaleString()}</Text></View>
    </ViewShot> : <View style={styles.photoPlaceholder}><Text style={{ fontSize: 28, color: BLUE }}>＋</Text><Text style={styles.placeholderText}>Photo not captured</Text></View>}
    <View style={styles.photoFooter}><View style={{ flex: 1 }}><Text style={styles.photoTitle}>{title}</Text><Text style={styles.photoDescription}>{description}</Text>{photo && <Text style={styles.photoMeta}>Address stamped · ready to compress</Text>}</View><Pressable disabled={busy} onPress={onPress} style={styles.captureButton}><Text style={styles.captureButtonText}>{busy ? "Wait…" : photo ? "Retake" : "Take photo"}</Text></Pressable></View>
  </View>;
}

function ResponseButton({ label, sublabel, active, color, onPress }: any) {
  return <Pressable onPress={onPress} style={[styles.responseButton, { borderColor: active ? color : "#DFE6F0", backgroundColor: active ? `${color}0D` : "#FFFFFF" }]}><View style={[styles.radioOuter, { borderColor: active ? color : "#AAB5C5" }]}>{active && <View style={[styles.radioInner, { backgroundColor: color }]} />}</View><View style={{ flex: 1 }}><Text style={[styles.responseTitle, { color: active ? color : INK }]}>{label}</Text><Text style={styles.responseSub}>{sublabel}</Text></View></Pressable>;
}

const styles: any = {
  page: { flex: 1, backgroundColor: BG }, scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 }, center: { flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", padding: 24 }, loadingText: { marginTop: 10, color: MUTED, fontSize: 13 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18, gap: 12 }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3EAF4", alignItems: "center", justifyContent: "center" }, backText: { color: INK, fontSize: 28, marginTop: -3 }, title: { color: INK, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 }, subtitle: { color: MUTED, fontSize: 12, marginTop: 4, lineHeight: 17 },
  hospitalCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E5EBF4", padding: 15, gap: 13, marginBottom: 14 }, hospitalIcon: { width: 58, height: 58, borderRadius: 16, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center" }, hospitalName: { fontSize: 16, fontWeight: "800", color: INK }, address: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 4 }, bucketTag: { color: BLUE, fontSize: 9, fontWeight: "800", letterSpacing: 1, marginTop: 8 },
  introCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#E5EBF4" }, stepBadge: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#E8F0FF", alignItems: "center", justifyContent: "center", marginBottom: 12 }, stepBadgeText: { color: BLUE, fontWeight: "800", fontSize: 14 }, sectionTitle: { color: INK, fontSize: 17, fontWeight: "800" }, bodyText: { color: MUTED, fontSize: 12, lineHeight: 19, marginTop: 5 }, requirementRow: { flexDirection: "row", alignItems: "center", marginTop: 13, gap: 9 }, check: { color: "#16834B", fontSize: 15, fontWeight: "900" }, requirement: { color: INK, fontSize: 13, fontWeight: "600" }, primaryButton: { minHeight: 52, paddingHorizontal: 16, borderRadius: 15, backgroundColor: BLUE, alignItems: "center", justifyContent: "center", flexDirection: "row", marginTop: 20, shadowColor: BLUE, shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  progressRow: { flexDirection: "row", alignItems: "center", marginVertical: 8, gap: 5 }, progressActive: { height: 4, flex: 1, borderRadius: 9, backgroundColor: BLUE }, progressInactive: { height: 4, flex: 1, borderRadius: 9, backgroundColor: "#DCE4F1" }, progressLabel: { fontSize: 9, color: MUTED, fontWeight: "800", marginLeft: 5 }, sectionCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#E5EBF4", marginTop: 12 }, sectionHeadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }, counter: { fontSize: 12, fontWeight: "800", color: BLUE, backgroundColor: "#EDF3FF", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  photoBlock: { borderWidth: 1, borderColor: "#E3EAF4", borderRadius: 15, overflow: "hidden", marginBottom: 12, backgroundColor: "#FBFCFE" }, photoShot: { width: "100%", height: 190, backgroundColor: "#EAF0F8" }, photoImage: { width: "100%", height: "100%" }, photoPlaceholder: { height: 130, backgroundColor: "#F3F6FB", alignItems: "center", justifyContent: "center" }, placeholderText: { color: MUTED, fontSize: 11, marginTop: 5 }, gpsOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,23,45,0.78)", paddingHorizontal: 11, paddingVertical: 8 }, gpsTitle: { color: "#A9D2FF", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, gpsText: { color: "#FFFFFF", fontSize: 10, fontWeight: "600", marginTop: 2 }, photoFooter: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 }, photoTitle: { color: INK, fontSize: 13, fontWeight: "800" }, photoDescription: { color: MUTED, fontSize: 10, marginTop: 3 }, photoMeta: { color: "#16834B", fontSize: 10, fontWeight: "700", marginTop: 5 }, captureButton: { backgroundColor: "#EAF1FF", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 11 }, captureButtonText: { color: BLUE, fontSize: 11, fontWeight: "800" }, infoBanner: { flexDirection: "row", gap: 8, backgroundColor: "#F0F6FF", padding: 12, borderRadius: 12, marginTop: 2 }, infoIcon: { color: BLUE, fontWeight: "900", fontSize: 15 }, infoText: { flex: 1, color: "#49617F", fontSize: 11, lineHeight: 17 }, responseRow: { gap: 9 }, responseButton: { minHeight: 64, borderWidth: 1.5, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }, radioOuter: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" }, radioInner: { width: 9, height: 9, borderRadius: 5 }, responseTitle: { fontSize: 13, fontWeight: "800" }, responseSub: { color: MUTED, fontSize: 10, marginTop: 3 }, fieldLabel: { color: INK, fontSize: 12, fontWeight: "800", marginBottom: 7 }, reasonInput: { minHeight: 94, borderWidth: 1, borderColor: "#DFE6F0", borderRadius: 12, padding: 12, color: INK, fontSize: 13, backgroundColor: "#FBFCFE" }, nextInfo: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#ECF8F1", padding: 11, borderRadius: 11, marginTop: 13 }, errorBanner: { backgroundColor: "#FFF0F0", borderRadius: 12, padding: 12, marginTop: 12 }, errorText: { color: "#B42318", fontSize: 12, lineHeight: 18 }, cancelButton: { padding: 15, alignItems: "center" }, cancelText: { color: MUTED, fontSize: 12, fontWeight: "700" },
};
