import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../../auth/store";
import { HbcApiError, errorMessage, setHbcUserId } from "../../../api/client";
import { listServices } from "../../../api/catalog";
import { getMyProfile, registerProfile } from "../../../api/profile";
import { CARE_TYPES, type CareService, type CareType, type Provider } from "../../../api/types";
import { Button, C, Card, ErrorBanner, Field } from "../../../components/ui";
import { careTypeLabel } from "../../../utils/format";
import { useOptionalHbcStore } from "../../provider-state/store";
import { useCurrentLocation } from "../../profile/useCurrentLocation";
import { validateLocation } from "../../profile/validate";

export default function HBCProviderRegistration({ navigation, route }: any) {
  const params = route?.params || {};
  const careType: CareType = CARE_TYPES.includes(params.careType) ? params.careType : "NURSE";
  const { setUser } = useAuth();
  const hbcStore = useOptionalHbcStore();
  const { locate, locating } = useCurrentLocation();

  const [form, setForm] = useState({ fullName: "", phone: "", city: "", pincode: "", latitude: "", longitude: "", licenseNo: "", experienceYears: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  // The server requires at least one catalog service (serviceIds) of this care type.
  const [services, setServices] = useState<CareService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const toggleService = (id: string) => setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const loadServices = async () => {
    setServicesLoading(true);
    setServicesError("");
    try {
      setServices(await listServices(careType));
    } catch (e) {
      setServicesError(errorMessage(e, "Unable to load services."));
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careType]);

  const useMyLocation = async () => {
    try {
      const loc = await locate();
      setForm((f) => ({
        ...f,
        latitude: loc.latitude.toFixed(6),
        longitude: loc.longitude.toFixed(6),
        pincode: f.pincode || loc.postalCode || "",
        city: f.city || loc.city || "",
      }));
    } catch (e) {
      Alert.alert("Location unavailable", errorMessage(e));
    }
  };

  // No admin verification: once the profile exists the provider can work.
  const finish = (profile: Provider) => {
    if (hbcStore) {
      hbcStore.setProfile(profile);
      return;
    }
    const userId = params.sub;
    if (params.accessToken && userId) {
      setUser({ id: userId, sub: userId, providerType: params.role || "HBC", role: params.role || "HBC", accessToken: params.accessToken, refreshToken: params.refreshToken });
    } else {
      navigation.replace("Login");
    }
  };

  const submit = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) return setError("Full name and phone are required.");
    const loc = validateLocation(form.pincode, form.latitude, form.longitude, true);
    if (typeof loc === "string") return setError(loc);
    if (selected.length === 0) return setError("Pick at least one service you provide.");
    const years = form.experienceYears.trim() ? Number(form.experienceYears) : undefined;
    if (years !== undefined && (!Number.isInteger(years) || years < 0)) return setError("Experience must be a whole number of years.");

    setBusy(true);
    setError("");
    try {
      if (params.sub) setHbcUserId(params.sub);
      const profile = await registerProfile({
        careType,
        serviceIds: selected,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        ...loc,
        city: form.city.trim() || undefined,
        licenseNo: form.licenseNo.trim() || undefined,
        experienceYears: years,
      });
      finish(profile);
    } catch (e) {
      if (e instanceof HbcApiError) console.log("HBC register failed:", e.status, JSON.stringify(e.data));
      if (e instanceof HbcApiError && e.status === 409) {
        // Already registered (e.g. a retried submit): continue with the existing profile.
        try {
          finish(await getMyProfile());
          return;
        } catch {}
      }
      setError(errorMessage(e, "Unable to register your profile."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={C.ink} /></Pressable>
          <Text style={{ color: C.blue, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginTop: 14 }}>UYIR · HOME-BASED CARE</Text>
          <Text style={{ marginTop: 8, fontSize: 26, fontWeight: "900", color: C.ink }}>{careTypeLabel(careType)} profile</Text>
          <Text style={{ marginTop: 8, color: C.muted, lineHeight: 20 }}>
            You will see bookings in your pincode or within the service radius of your location. No approval wait — you can pick bookings right after registering.
          </Text>

          <Card style={{ marginTop: 20 }}>
            <Field label="Full name" required value={form.fullName} onChangeText={set("fullName")} placeholder="Anitha Kumar" editable={!busy} />
            <Field label="Phone" required value={form.phone} onChangeText={set("phone")} placeholder="+919876543210" keyboardType="phone-pad" editable={!busy} />
            <Field label="License number" value={form.licenseNo} onChangeText={set("licenseNo")} editable={!busy} />
            <Field label="Years of experience" value={form.experienceYears} onChangeText={set("experienceYears")} keyboardType="number-pad" editable={!busy} />
          </Card>

          <Card style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: C.ink, fontWeight: "900", fontSize: 15 }}>Service location</Text>
              <Pressable onPress={useMyLocation} disabled={locating} style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="locate" size={16} color={C.blue} />
                <Text style={{ color: C.blue, fontWeight: "800", marginLeft: 5 }}>{locating ? "Locating…" : "Use my location"}</Text>
              </Pressable>
            </View>
            <Field label="Pincode" required value={form.pincode} onChangeText={set("pincode")} placeholder="600017" keyboardType="number-pad" editable={!busy} />
            <Field label="City" value={form.city} onChangeText={set("city")} placeholder="Chennai" editable={!busy} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Field label="Latitude" required value={form.latitude} onChangeText={set("latitude")} keyboardType="numbers-and-punctuation" editable={!busy} /></View>
              <View style={{ flex: 1 }}><Field label="Longitude" required value={form.longitude} onChangeText={set("longitude")} keyboardType="numbers-and-punctuation" editable={!busy} /></View>
            </View>
          </Card>

          <Card style={{ marginTop: 14 }}>
            <Text style={{ color: C.ink, fontWeight: "900", fontSize: 15 }}>Services you provide</Text>
            <Text style={{ color: C.muted, marginTop: 4, marginBottom: 10 }}>Pick at least one. You will get bookings for these services.</Text>
            {servicesLoading ? (
              <ActivityIndicator color={C.blue} />
            ) : servicesError ? (
              <Pressable onPress={loadServices}><Text style={{ color: C.blue, fontWeight: "800" }}>{servicesError} Tap to retry.</Text></Pressable>
            ) : services.length === 0 ? (
              <Pressable onPress={loadServices}>
                <Text style={{ color: C.muted }}>No {careTypeLabel(careType)} services are set up yet. Ask the admin to add them, then tap here to refresh.</Text>
              </Pressable>
            ) : (
              services.map((svc) => {
                const on = selected.includes(svc.id);
                return (
                  <Pressable
                    key={svc.id}
                    onPress={() => toggleService(svc.id)}
                    disabled={busy}
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB" }}
                  >
                    <Ionicons name={on ? "checkbox" : "square-outline"} size={22} color={on ? C.blue : C.muted} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: C.ink, fontWeight: "700" }}>{svc.name}</Text>
                      <Text style={{ color: C.muted, fontSize: 12 }}>₹{svc.price} · {svc.durationMinutes} min</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </Card>

          <View style={{ marginTop: 16 }}><ErrorBanner message={error} /></View>
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <Button title="Register and continue" onPress={submit} busy={busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
