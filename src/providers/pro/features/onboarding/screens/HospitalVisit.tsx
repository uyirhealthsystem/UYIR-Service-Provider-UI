import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";

import { getBucket } from "../../../api/bucket";
import { updateProHospitalStatus, uploadProHospitalImages } from "../../../api/onboarding";
import { getMyProfile } from "../../../api/profile";
import { colors, radius, shadow, spacing, typography } from "../../../theme";
import { Button, Card, ErrorBanner, HeaderIconButton, IconBadge, Pill } from "../../../ui/components";
import { proIdFrom, splitHospitalName, timeLeft, urgencyTone } from "../../../ui/format";

// Hospital visit (from the bucket):
//   1. Two on-site photos, stamped with city / district / pincode / time and
//      compressed under 100 KB -> PATCH /pro/hospital/:id/images
//   2. The hospital's answer:
//      - interested     -> HospitalOnboarding form
//      - not interested -> PATCH /pro/hospital/:id { status: HOSPITAL_REJECTED, reason }

type VisitPhoto = { uri: string; latitude: number; longitude: number; capturedAt: string; city: string; district: string; pincode: string; state: string; country: string };
type Answer = "interested" | "notInterested" | "";

const MAX_BYTES = 100 * 1024;
const QUICK_REASONS = ["Not planning to join now", "Management not available", "Already with another network", "Wants more details first", "Concerned about fees"];

export default function HospitalVisit({ navigation }: any) {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const proHospitalId: string | undefined = route.params?.proHospitalId;

  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hospitalPhoto, setHospitalPhoto] = useState<VisitPhoto | null>(null);
  const [proPhoto, setProPhoto] = useState<VisitPhoto | null>(null);
  const [answer, setAnswer] = useState<Answer>("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState<"hospital" | "pro" | null>(null);
  const [error, setError] = useState("");
  const hospitalShot = useRef<any>(null);
  const proShot = useRef<any>(null);

  const loadHospital = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const proId = proIdFrom(await getMyProfile());
      if (!proId) throw new Error("Your PRO profile could not be found. Please log in again.");
      const response = await getBucket(proId);
      const hospitals = Array.isArray(response?.data?.hospitals) ? response.data.hospitals : Array.isArray(response?.data) ? response.data : Array.isArray(response?.hospitals) ? response.hospitals : [];
      setHospital(hospitals.find((item: any) => item.proHospitalId === proHospitalId) || null);
    } catch (e: any) {
      setError(e?.message || "Unable to load hospital details.");
      setHospital(null);
    } finally {
      setLoading(false);
    }
  }, [proHospitalId]);

  useFocusEffect(useCallback(() => { loadHospital(); }, [loadHospital]));

  const capturePhoto = async (type: "hospital" | "pro") => {
    try {
      setCapturing(type);
      setError("");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error("Camera permission is required to capture visit proof.");
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== "granted") throw new Error("Location permission is required. Enable location to stamp the visit photo.");
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
    } finally {
      setCapturing(null);
    }
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
    if (!proHospitalId) throw new Error("This visit is missing its bucket entry. Go back and open it from your bucket.");
    const [first, second] = await Promise.all([
      captureStampedPhoto(hospitalShot, hospitalPhoto),
      captureStampedPhoto(proShot, proPhoto),
    ]);
    await uploadProHospitalImages(proHospitalId, first, second);
  };

  const submit = async () => {
    if (saving) return;
    if (answer === "notInterested" && !reason.trim()) {
      setError("Tell us why the hospital is not interested.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await uploadVisitProof();
      if (answer === "interested") {
        navigation.navigate("HospitalOnboarding", {
          proHospitalId,
          hospitalPoolId: hospital?.hospitalPoolId || route.params?.hospitalPoolId,
          hospital,
        });
        return;
      }
      await updateProHospitalStatus(proHospitalId!, { status: "HOSPITAL_REJECTED", reason: reason.trim() });
      Alert.alert("Visit recorded", "The visit photos and the hospital's response were saved.", [
        { text: "Done", onPress: () => navigation.navigate("ProLayout") },
      ]);
    } catch (e: any) {
      setError(e?.message || "Unable to submit the visit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={[typography.caption, { marginTop: spacing.md }]}>Loading hospital details…</Text>
      </SafeAreaView>
    );
  }

  if (!hospital) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: "center" }}>
        <Card>
          <IconBadge icon="alert-circle" tone="red" />
          <Text style={[typography.heading, { marginTop: spacing.md }]}>Hospital not in your bucket</Text>
          <Text style={[typography.body, { marginTop: spacing.xs }]}>{error || "It may have been released or expired. Pick it again from Find hospitals."}</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Go back" variant="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
            <Button label="Try again" onPress={loadHospital} style={{ flex: 1 }} />
          </View>
        </Card>
      </SafeAreaView>
    );
  }

  const { title, subtitle } = splitHospitalName(hospital?.hospitalPool?.name || hospital?.name, hospital?.hospitalPool?.address || hospital?.address);
  const window = timeLeft(hospital?.blockExpiresAt);
  const photoCount = Number(!!hospitalPhoto) + Number(!!proPhoto);
  const photosDone = photoCount === 2;
  const ready = photosDone && answer !== "" && (answer === "interested" || !!reason.trim());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <HeaderIconButton icon="arrow-back" label="Back" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={typography.heading}>Hospital visit</Text>
          <Text style={typography.caption}>Photos first, then the hospital's answer</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Hospital */}
        <Card>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <IconBadge icon="business" />
            <View style={{ flex: 1 }}>
              <Text style={typography.heading} numberOfLines={2}>{title}</Text>
              {subtitle ? <Text style={[typography.caption, { marginTop: 3, lineHeight: 17 }]} numberOfLines={2}>{subtitle}</Text> : null}
            </View>
          </View>
          {!window.unknown ? (
            <View style={{ marginTop: spacing.md }}>
              <Pill tone={urgencyTone(window.ms, window.expired)} icon="time-outline" label={window.expired ? "VISIT WINDOW PASSED" : `VISIT WINDOW · ${window.label.toUpperCase()}`} />
            </View>
          ) : null}
        </Card>

        {/* Step 1 - photos */}
        <StepTitle number={1} title="Capture two photos" done={photosDone} caption={`${photoCount} of 2 captured · location enabled`} />
        <PhotoCapture
          title="Hospital exterior"
          description="The building or its name board"
          icon="business-outline"
          photo={hospitalPhoto}
          shotRef={hospitalShot}
          busy={capturing === "hospital"}
          disabled={capturing !== null || saving}
          onPress={() => capturePhoto("hospital")}
        />
        <PhotoCapture
          title="You at the hospital"
          description="A clear photo of you on site"
          icon="person-outline"
          photo={proPhoto}
          shotRef={proShot}
          busy={capturing === "pro"}
          disabled={capturing !== null || saving}
          onPress={() => capturePhoto("pro")}
        />
        <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.brandSoft, borderRadius: radius.md }}>
          <Ionicons name="shield-checkmark" size={17} color={colors.brand} />
          <Text style={[typography.caption, { flex: 1, color: colors.textSecondary, lineHeight: 17 }]}>
            City, district, pincode and time are stamped on each photo. GPS coordinates are kept as data, not printed. Photos are compressed to under 100 KB before upload.
          </Text>
        </View>

        {/* Step 2 - response */}
        <StepTitle number={2} title="Is the hospital interested?" done={answer !== ""} caption={photosDone ? "Choose after speaking with the hospital" : "Capture both photos first"} />
        <View style={{ gap: spacing.md, opacity: photosDone ? 1 : 0.45 }} pointerEvents={photosDone ? "auto" : "none"}>
          <AnswerCard
            selected={answer === "interested"}
            tone="green"
            icon="thumbs-up"
            title="Yes, interested"
            subtitle="Next: enter hospital, facility and doctor details"
            onPress={() => { setAnswer("interested"); setError(""); }}
          />
          <AnswerCard
            selected={answer === "notInterested"}
            tone="red"
            icon="thumbs-down"
            title="Not interested"
            subtitle="Record the reason and finish the visit"
            onPress={() => { setAnswer("notInterested"); setError(""); }}
          />
          {answer === "notInterested" ? (
            <Card>
              <Text style={typography.label}>Reason <Text style={{ color: colors.red }}>*</Text></Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
                {QUICK_REASONS.map((r) => {
                  const on = reason === r;
                  return (
                    <Pressable key={r} onPress={() => { setReason(on ? "" : r); setError(""); }} style={{ paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: on ? colors.brand : colors.border, backgroundColor: on ? colors.brandSoft : colors.surface }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: on ? colors.brand : colors.textSecondary }}>{r}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={reason}
                onChangeText={(v) => { setReason(v); setError(""); }}
                placeholder="Or describe what the hospital said"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={{ marginTop: spacing.md, minHeight: 90, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.text, backgroundColor: colors.surfaceMuted }}
              />
            </Card>
          ) : null}
        </View>

        {error ? <ErrorBanner message={error} /> : null}
      </ScrollView>

      {/* Sticky action */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md + insets.bottom, borderTopWidth: 1, borderTopColor: colors.divider, ...shadow.floating }}>
        <Button
          label={saving ? "Compressing & uploading photos…" : answer === "notInterested" ? "Submit visit" : "Continue to onboarding"}
          icon={answer === "notInterested" ? "checkmark-done" : "arrow-forward"}
          variant={answer === "notInterested" ? "danger" : "primary"}
          onPress={submit}
          loading={saving}
          disabled={!ready || capturing !== null}
        />
        {!ready && !saving ? (
          <Text style={[typography.caption, { textAlign: "center", marginTop: 6 }]}>
            {!photosDone ? "Capture both photos to continue" : answer === "" ? "Choose the hospital's answer" : "Add a reason to submit"}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function StepTitle({ number, title, caption, done }: { number: number; title: string; caption: string; done: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.md }}>
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: done ? colors.green : colors.brand, alignItems: "center", justifyContent: "center", marginRight: spacing.md }}>
        {done ? <Ionicons name="checkmark" size={17} color={colors.white} /> : <Text style={{ color: colors.white, fontWeight: "800" }}>{number}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={typography.heading}>{title}</Text>
        <Text style={typography.caption}>{caption}</Text>
      </View>
    </View>
  );
}

function PhotoCapture({ title, description, icon, photo, onPress, shotRef, busy, disabled }: { title: string; description: string; icon: any; photo: VisitPhoto | null; onPress: () => void; shotRef: any; busy: boolean; disabled: boolean }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: photo ? colors.green : colors.border, overflow: "hidden", marginBottom: spacing.md, ...shadow.card }}>
      {photo ? (
        // The stamped overlay is part of the captured image, so keep it inside the ViewShot.
        <ViewShot ref={shotRef} options={{ format: "jpg", quality: 0.95 }} style={{ width: "100%", height: 200, backgroundColor: colors.surfaceMuted }}>
          <Image source={{ uri: photo.uri }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,23,45,0.78)", paddingHorizontal: 11, paddingVertical: 8 }}>
            <Text style={{ color: "#A9D2FF", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }}>UYIR · HOSPITAL VISIT PROOF</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600", marginTop: 2 }}>City: {photo.city}  ·  District: {photo.district}</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600", marginTop: 2 }}>Pincode: {photo.pincode}  ·  {photo.state}, {photo.country}</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600", marginTop: 2 }}>{new Date(photo.capturedAt).toLocaleString()}</Text>
          </View>
        </ViewShot>
      ) : (
        <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={`Take photo: ${title}`} style={({ pressed }) => ({ height: 150, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? colors.brandSoft : colors.surfaceMuted, opacity: disabled && !busy ? 0.6 : 1 })}>
          {busy ? <ActivityIndicator color={colors.brand} /> : <IconBadge icon="camera" size={52} />}
          <Text style={[typography.caption, { marginTop: spacing.sm, color: colors.brand, fontWeight: "700" }]}>{busy ? "Getting location & camera…" : "Tap to take photo"}</Text>
        </Pressable>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.md }}>
        <Ionicons name={photo ? "checkmark-circle" : icon} size={22} color={photo ? colors.green : colors.muted} />
        <View style={{ flex: 1 }}>
          <Text style={typography.label}>{title}</Text>
          <Text style={typography.caption}>{photo ? "Captured · address stamped" : description}</Text>
        </View>
        {photo ? <Button label="Retake" icon="camera-reverse-outline" variant="secondary" compact onPress={onPress} disabled={disabled} loading={busy} /> : null}
      </View>
    </View>
  );
}

function AnswerCard({ selected, tone, icon, title, subtitle, onPress }: { selected: boolean; tone: "green" | "red"; icon: any; title: string; subtitle: string; onPress: () => void }) {
  const fg = tone === "green" ? colors.green : colors.red;
  const bg = tone === "green" ? colors.greenSoft : colors.redSoft;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? fg : colors.border, backgroundColor: selected ? bg : colors.surface, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: selected ? colors.surface : bg, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={20} color={fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.heading, { color: selected ? fg : colors.text }]}>{title}</Text>
        <Text style={typography.caption}>{subtitle}</Text>
      </View>
      <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? fg : colors.muted} />
    </Pressable>
  );
}
