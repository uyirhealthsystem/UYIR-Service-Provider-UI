import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { errorMessage } from "../../../api/client";
import { updateMyProfile } from "../../../api/profile";
import type { Provider, ProviderProfilePatch } from "../../../api/types";
import { Button, C, Card, ErrorBanner, Field, Header } from "../../../components/ui";
import { careTypeLabel } from "../../../utils/format";
import { useHbcStore } from "../../provider-state/store";
import { useCurrentLocation } from "../useCurrentLocation";
import { validateLocation } from "../validate";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function formFrom(p: Provider | null) {
  return {
    fullName: str(p?.fullName), phone: str(p?.phone), licenseNo: str(p?.licenseNo), experienceYears: str(p?.experienceYears),
    city: str(p?.city), pincode: str(p?.pincode), latitude: str(p?.latitude), longitude: str(p?.longitude),
  };
}

export default function EditProfile({ navigation }: any) {
  const { profile, setProfile } = useHbcStore();
  const { locate, locating } = useCurrentLocation();
  const original = formFrom(profile);
  const [form, setForm] = useState(original);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const useMyLocation = async () => {
    try {
      const loc = await locate();
      setForm((f) => ({ ...f, latitude: loc.latitude.toFixed(6), longitude: loc.longitude.toFixed(6), pincode: loc.postalCode || f.pincode, city: loc.city || f.city }));
    } catch (e) {
      Alert.alert("Location unavailable", errorMessage(e));
    }
  };

  const save = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) return setError("Full name and phone are required.");
    // Profiles registered before location matching may have no location; require it now.
    const loc = validateLocation(form.pincode, form.latitude, form.longitude, true);
    if (typeof loc === "string") return setError(loc);

    // Send only changed fields. careType is never sent (the API rejects it).
    const patch: ProviderProfilePatch = {};
    if (form.fullName.trim() !== original.fullName) patch.fullName = form.fullName.trim();
    if (form.phone.trim() !== original.phone) patch.phone = form.phone.trim();
    if (form.licenseNo.trim() !== original.licenseNo) patch.licenseNo = form.licenseNo.trim();
    if (form.city.trim() !== original.city) patch.city = form.city.trim();
    if (loc.pincode !== original.pincode) patch.pincode = loc.pincode;
    if (form.experienceYears.trim() !== original.experienceYears) {
      const years = Number(form.experienceYears);
      if (!Number.isInteger(years) || years < 0) return setError("Experience must be a whole number of years.");
      patch.experienceYears = years;
    }
    if (String(loc.latitude) !== original.latitude || String(loc.longitude) !== original.longitude) {
      patch.latitude = loc.latitude;
      patch.longitude = loc.longitude;
    }
    if (!Object.keys(patch).length) return navigation.goBack();

    setBusy(true);
    setError("");
    try {
      setProfile(await updateMyProfile(patch));
      navigation.goBack();
    } catch (e) {
      setError(errorMessage(e, "Unable to save your profile."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <Header title="Edit profile" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
          <Card>
            <Field label="Care type" value={careTypeLabel(profile?.careType)} editable={false} />
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>Care type is fixed after registration.</Text>
            <Field label="Full name" required value={form.fullName} onChangeText={set("fullName")} editable={!busy} />
            <Field label="Phone" required value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" editable={!busy} />
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
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>You see bookings in this pincode or within the service radius of these coordinates.</Text>
            <Field label="Pincode" required value={form.pincode} onChangeText={set("pincode")} keyboardType="number-pad" editable={!busy} />
            <Field label="City" value={form.city} onChangeText={set("city")} editable={!busy} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Field label="Latitude" required value={form.latitude} onChangeText={set("latitude")} keyboardType="numbers-and-punctuation" editable={!busy} /></View>
              <View style={{ flex: 1 }}><Field label="Longitude" required value={form.longitude} onChangeText={set("longitude")} keyboardType="numbers-and-punctuation" editable={!busy} /></View>
            </View>
          </Card>

          <View style={{ marginTop: 14 }}><ErrorBanner message={error} /></View>
          <View style={{ flexDirection: "row" }}>
            <Button title="Save changes" onPress={save} busy={busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
