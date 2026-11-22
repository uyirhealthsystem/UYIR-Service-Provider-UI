import { useCallback, useEffect, useState } from "react";
import { Alert, Text } from "react-native";

import { getProfile, updateProfile } from "../../../api/profile";
import { spacing, typography } from "../../../theme";
import { Button, Card, ErrorBanner, Field, LoadingView, OptionSheet, Screen, ScreenHeader, SelectField } from "../../../ui/components";
import {
  dobToDisplay,
  dobToIso,
  GENDERS,
  genderLabel,
  isValidEmail,
  isValidPhone,
  isValidPincode,
  maskDob,
  normalizePhone,
} from "../../../ui/format";
import { LocationFields, useLocation } from "../../location/LocationFields";

// PATCH /profile takes any subset of profile fields. Only changed fields are
// sent: the server rejects "" for email / pincode / dateOfBirth, so a field
// can be changed but not blanked once set. Location is replaced as a group
// (districtId + optional blockId / villageId; omitted ones are cleared).

type Form = {
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY: Form = { fullName: "", phone: "", email: "", dob: "", gender: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" };

function formFrom(p: any): Form {
  return {
    fullName: p?.fullName || "",
    phone: p?.phone || "",
    email: p?.email || "",
    dob: dobToDisplay(p?.dateOfBirth),
    gender: p?.gender || "",
    addressLine1: p?.addressLine1 || "",
    addressLine2: p?.addressLine2 || "",
    city: p?.city || "",
    state: p?.state || "",
    pincode: p?.pincode || "",
  };
}

export default function EditProfile({ navigation }: any) {
  const [original, setOriginal] = useState<any>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "district", string>>>({});
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [genderPicker, setGenderPicker] = useState(false);
  const location = useLocation();
  const { reset: resetLocation } = location;

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const data = await getProfile();
      setOriginal(data);
      setForm(formFrom(data));
      resetLocation({ districtId: data?.districtId, blockId: data?.blockId, villageId: data?.villageId });
    } catch (e: any) {
      setLoadError(e?.message || "Unable to load your details.");
    }
  }, [resetLocation]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof Form) => (text: string) => {
    setForm((prev) => ({ ...prev, [key]: text }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const save = async () => {
    const next: typeof errors = {};
    if (!form.fullName.trim()) next.fullName = "Enter your full name.";
    if (!isValidPhone(form.phone)) next.phone = "Enter a valid 10-digit mobile number.";
    if (form.email.trim() && !isValidEmail(form.email)) next.email = "Enter a valid email address.";
    if (original?.email && !form.email.trim()) next.email = "Email can be changed but not removed.";
    if (form.dob && !dobToIso(form.dob)) next.dob = "Enter a real date as DD/MM/YYYY (age 18 or above).";
    if (original?.dateOfBirth && !form.dob) next.dob = "Date of birth can be changed but not removed.";
    if (form.pincode.trim() && !isValidPincode(form.pincode)) next.pincode = "Pincode is 6 digits.";
    if (original?.pincode && !form.pincode.trim()) next.pincode = "Pincode can be changed but not removed.";
    if (!location.value.districtId) next.district = "Select your district.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const wanted: Record<string, string> = {
      fullName: form.fullName.trim(),
      phone: normalizePhone(form.phone),
      email: form.email.trim(),
      dateOfBirth: form.dob ? (dobToIso(form.dob) as string) : "",
      gender: form.gender,
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    };
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(wanted)) {
      if (value !== (original?.[key] || "") && value !== "") patch[key] = value;
    }
    const loc = location.value;
    if (loc.districtId !== (original?.districtId || "") || loc.blockId !== (original?.blockId || "") || loc.villageId !== (original?.villageId || "")) {
      patch.districtId = loc.districtId;
      patch.blockId = loc.blockId || null;
      patch.villageId = loc.villageId || null;
    }

    if (!Object.keys(patch).length) {
      navigation.goBack();
      return;
    }

    try {
      setSaving(true);
      setSaveError("");
      await updateProfile(patch);
      Alert.alert("Profile updated", "Your details have been saved.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      setSaveError(e?.message || "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!original && !loadError) return <LoadingView label="Loading your details..." />;

  return (
    <Screen footer={original ? <Button label="Save changes" onPress={save} loading={saving} /> : undefined}>
      <ScreenHeader title="Personal details" subtitle="Keep your details up to date so we can reach you." onBack={() => navigation.goBack()} />
      {loadError ? <ErrorBanner message={loadError} onRetry={load} /> : null}
      {saveError ? <ErrorBanner message={saveError} /> : null}
      {location.error ? <ErrorBanner message={location.error} onRetry={location.retry} /> : null}

      {original ? (
        <>
          <Text style={[typography.overline, { marginBottom: spacing.sm }]}>ABOUT YOU</Text>
          <Card>
            <Field label="Full name" required icon="person-outline" value={form.fullName} onChangeText={set("fullName")} autoCapitalize="words" error={errors.fullName} />
            <Field
              label="Mobile number"
              required
              icon="call-outline"
              value={form.phone}
              onChangeText={set("phone")}
              keyboardType="phone-pad"
              maxLength={14}
              error={errors.phone}
            />
            <Field
              label="Email"
              icon="mail-outline"
              value={form.email}
              onChangeText={set("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <Field
              label="Date of birth"
              icon="calendar-outline"
              value={form.dob}
              onChangeText={(t) => set("dob")(maskDob(t))}
              placeholder="DD/MM/YYYY"
              keyboardType="number-pad"
              maxLength={10}
              error={errors.dob}
            />
            <SelectField label="Gender" icon="male-female-outline" value={genderLabel(form.gender)} placeholder="Select gender" onPress={() => setGenderPicker(true)} />
          </Card>

          <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>WORKING AREA</Text>
          <Card>
            <LocationFields location={location} districtError={errors.district} />
          </Card>

          <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>ADDRESS</Text>
          <Card>
            <Field label="House / street" value={form.addressLine1} onChangeText={set("addressLine1")} placeholder="e.g. 5 Temple Road" />
            <Field label="Area / landmark" value={form.addressLine2} onChangeText={set("addressLine2")} placeholder="e.g. Near bus stand" />
            <Field label="City / town" value={form.city} onChangeText={set("city")} autoCapitalize="words" />
            <Field label="State" value={form.state} onChangeText={set("state")} autoCapitalize="words" placeholder="e.g. Tamil Nadu" />
            <Field
              label="Pincode"
              value={form.pincode}
              onChangeText={(t) => set("pincode")(t.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pincode}
            />
          </Card>
        </>
      ) : null}

      <OptionSheet
        visible={genderPicker}
        title="Gender"
        options={GENDERS}
        selectedId={form.gender}
        onSelect={(id) => {
          set("gender")(id);
          setGenderPicker(false);
        }}
        onClose={() => setGenderPicker(false)}
      />
    </Screen>
  );
}
