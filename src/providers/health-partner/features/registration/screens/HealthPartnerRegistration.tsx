import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";

import { useAuth } from "../../../../../auth/store";
import { createHealthPartner } from "../../../api/healthPartner";
import { colors, HP_RULES, radius, spacing, typography } from "../../../theme";
import { Banner, Button, Card, ErrorBanner, Field, OptionSheet, Screen, SelectField } from "../../../ui/components";
import {
  dobToIso,
  GENDERS,
  genderLabel,
  isValidEmail,
  isValidPhone,
  isValidPincode,
  maskDob,
  money,
  normalizePhone,
} from "../../../ui/format";
import { LocationFields, useLocation } from "../../location/LocationFields";

// Shown once, right after an HP's first login (auth/service.ts sends them
// here when GET /profile says "Health Partner not found"). Creates the HP
// profile with POST /health-partners, then signs the user into the HP app.
// Two short steps instead of one long form: who you are, then where you work.

type Step = 1 | 2;
type Errors = Partial<Record<"fullName" | "phone" | "email" | "dob" | "district" | "pincode", string>>;

export default function HealthPartnerRegistration({ route }: any) {
  const { setUser } = useAuth();

  const accessToken = route.params?.accessToken;
  const refreshToken = route.params?.refreshToken;
  const userId = route.params?.sub;
  const role = String(route.params?.role || "HP").toUpperCase();

  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [genderPicker, setGenderPicker] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();

  const clear = (key: keyof Errors) => errors[key] && setErrors((prev) => ({ ...prev, [key]: undefined }));

  const validateStep1 = (): Errors => {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!isValidPhone(phone)) next.phone = "Enter a valid 10-digit mobile number.";
    if (email.trim() && !isValidEmail(email)) next.email = "Enter a valid email address.";
    if (dob && !dobToIso(dob)) next.dob = "Enter a real date as DD/MM/YYYY (age 18 or above).";
    return next;
  };

  const next = () => {
    const found = validateStep1();
    setErrors(found);
    if (!Object.keys(found).length) setStep(2);
  };

  const submit = async () => {
    const found: Errors = {};
    if (!location.value.districtId) found.district = "Select the district you work in.";
    if (pincode && !isValidPincode(pincode)) found.pincode = "Pincode is 6 digits.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const { districtId, blockId, villageId } = location.value;
    const optional = (value: string) => (value.trim() ? value.trim() : undefined);

    try {
      setSubmitting(true);
      setSubmitError("");

      await createHealthPartner({
        fullName: fullName.trim(),
        phone: normalizePhone(phone),
        email: optional(email),
        dateOfBirth: dob ? (dobToIso(dob) as string) : undefined,
        gender: (gender || undefined) as "MALE" | "FEMALE" | "OTHER" | undefined,
        addressLine1: optional(addressLine1),
        addressLine2: optional(addressLine2),
        city: optional(city),
        state: optional(state),
        pincode: optional(pincode),
        districtId,
        blockId: blockId || undefined,
        villageId: villageId || undefined,
        referralCode: optional(referralCode)?.toUpperCase(),
      });

      setUser({
        id: userId,
        sub: userId,
        providerType: role,
        role,
        accessToken,
        refreshToken,
      });
    } catch (submitErr: any) {
      console.log("HP registration error:", submitErr);
      const message = String(submitErr?.message || "Unable to create your profile. Please try again.");
      setSubmitError(
        /referral code/i.test(message)
          ? "That referral code isn't valid. Check it with the person who referred you, or leave it empty."
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      footer={
        step === 1 ? (
          <Button label="Continue" icon="arrow-forward" onPress={next} />
        ) : (
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Button label="Back" variant="ghost" onPress={() => setStep(1)} style={{ flex: 1 }} />
            <Button label="Create profile" onPress={submit} loading={submitting} style={{ flex: 2 }} />
          </View>
        )
      }
    >
      {/* Welcome */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="heart" size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.caption}>Welcome to Uyir</Text>
          <Text style={typography.title}>Set up your profile</Text>
        </View>
      </View>
      <Text style={[typography.body, { marginTop: spacing.md }]}>
        As a Health Partner you help families in your area join Uyir, and earn {money(HP_RULES.rewardPerReferral, { decimals: 0 })} for every
        successful referral.
      </Text>

      <StepIndicator step={step} />

      {submitError ? <ErrorBanner message={submitError} /> : null}
      {location.error ? <ErrorBanner message={location.error} onRetry={location.retry} /> : null}

      {step === 1 ? (
        <Card>
          <Field
            label="Full name"
            required
            icon="person-outline"
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              clear("fullName");
            }}
            placeholder="As on your Aadhaar"
            autoCapitalize="words"
            error={errors.fullName}
          />
          <Field
            label="Mobile number"
            required
            icon="call-outline"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              clear("phone");
            }}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={14}
            error={errors.phone}
          />
          <Field
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              clear("email");
            }}
            placeholder="Optional"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <Field
            label="Date of birth"
            icon="calendar-outline"
            value={dob}
            onChangeText={(t) => {
              setDob(maskDob(t));
              clear("dob");
            }}
            placeholder="DD/MM/YYYY"
            keyboardType="number-pad"
            maxLength={10}
            error={errors.dob}
          />
          <SelectField label="Gender" icon="male-female-outline" value={genderLabel(gender)} placeholder="Select gender" onPress={() => setGenderPicker(true)} />
        </Card>
      ) : (
        <>
          <Text style={[typography.overline, { marginBottom: spacing.sm }]}>WHERE YOU WORK</Text>
          <Card>
            <LocationFields location={location} districtError={errors.district} />
            <Text style={[typography.caption, { marginTop: -spacing.sm }]}>Block and village are optional. Pick them if you serve one village.</Text>
          </Card>

          <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>YOUR ADDRESS (OPTIONAL)</Text>
          <Card>
            <Field label="House / street" value={addressLine1} onChangeText={setAddressLine1} placeholder="e.g. 5 Temple Road" />
            <Field label="Area / landmark" value={addressLine2} onChangeText={setAddressLine2} placeholder="e.g. Near bus stand" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="City / town" value={city} onChangeText={setCity} autoCapitalize="words" />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Pincode"
                  value={pincode}
                  onChangeText={(t) => {
                    setPincode(t.replace(/\D/g, ""));
                    clear("pincode");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.pincode}
                />
              </View>
            </View>
            <Field label="State" value={state} onChangeText={setState} autoCapitalize="words" placeholder="e.g. Tamil Nadu" />
          </Card>

          <Text style={[typography.overline, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>REFERRED BY SOMEONE?</Text>
          <Card>
            <Field
              label="Referral code"
              icon="gift-outline"
              value={referralCode}
              onChangeText={(t) => setReferralCode(t.toUpperCase().replace(/\s/g, ""))}
              placeholder="Optional"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={30}
              hint="If another Health Partner invited you, enter their code. It can't be added later."
            />
          </Card>
          <Banner
            tone="neutral"
            icon="shield-checkmark-outline"
            message="Your details are used only to manage your Health Partner account and payouts."
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}

      <OptionSheet
        visible={genderPicker}
        title="Gender"
        options={GENDERS}
        selectedId={gender}
        onSelect={(id) => {
          setGender(id);
          setGenderPicker(false);
        }}
        onClose={() => setGenderPicker(false)}
      />
    </Screen>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = ["About you", "Your area"];
  return (
    <View
      style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.lg }}
      accessibilityLabel={`Step ${step} of 2: ${steps[step - 1]}`}
    >
      {steps.map((label, index) => {
        const n = index + 1;
        const done = n < step;
        const current = n === step;
        return (
          <View key={label} style={{ flex: 1 }}>
            <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: done || current ? colors.brand : colors.border }} />
            <Text style={{ marginTop: 6, fontSize: 12, fontWeight: current ? "800" : "600", color: current ? colors.text : colors.muted }}>
              {n}. {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
