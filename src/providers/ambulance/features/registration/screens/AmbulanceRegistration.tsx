import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { errorMessage } from "../../../api/errors";
import { createMyProfile } from "../../../api/profile";
import { addTechnician } from "../../../api/technicians";
import { isValidPhone, validateDriverProfile } from "../../../domain/trip";
import { colors, spacing, typography } from "../../../theme";
import type { DriverProfileRequest } from "../../../types";
import { Button, Card, ErrorBanner, SectionTitle, TextField } from "../../../ui/components";
import DriverFormFields from "../../profile/components/DriverFormFields";

const EMPTY_PROFILE: DriverProfileRequest = {
  fullName: "",
  phone: "",
  licenseNumber: "",
  plateNumber: "",
  ambulanceType: "BLS",
  districtId: "",
};

export default function AmbulanceRegistration({ navigation }: any) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [technicianName, setTechnicianName] = useState("");
  const [technicianPhone, setTechnicianPhone] = useState("");
  const [technicianQualification, setTechnicianQualification] = useState("");
  const [technicianCertification, setTechnicianCertification] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const technician = {
    fullName: technicianName.trim(),
    phone: technicianPhone.trim(),
    qualification: technicianQualification.trim() || undefined,
    certificationNumber: technicianCertification.trim() || undefined,
  };
  const hasTechnician = Boolean(
    technician.fullName ||
      technician.phone ||
      technician.qualification ||
      technician.certificationNumber,
  );

  function validate(): string | null {
    const profileProblem = validateDriverProfile(profile);
    if (profileProblem) return profileProblem;
    if (hasTechnician && (!technician.fullName || !technician.phone)) {
      return "Enter both the technician's name and mobile number, or leave this section empty.";
    }
    if (hasTechnician && !isValidPhone(technician.phone)) {
      return "Enter a technician mobile number with 10 to 13 digits.";
    }
    return null;
  }

  function showSubmitted(message: string) {
    Alert.alert("Registration submitted", message, [
      { text: "Continue", onPress: () => navigation.replace("PendingApproval") },
    ]);
  }

  async function submit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createMyProfile({
        ...profile,
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        licenseNumber: profile.licenseNumber.trim(),
        plateNumber: profile.plateNumber.trim(),
      });
    } catch (submitError) {
      setError(errorMessage(submitError, "Unable to register ambulance driver."));
      setLoading(false);
      return;
    }

    // The driver profile now exists, so a technician failure must not block onboarding.
    try {
      if (hasTechnician) await addTechnician(technician);
      showSubmitted("Your ambulance driver profile has been submitted.");
    } catch (technicianError) {
      showSubmitted(
        `Your driver profile was registered, but the technician could not be saved. Add them later in Profile. ${errorMessage(technicianError, "")}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView behavior="padding" style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <Text style={typography.title} accessibilityRole="header">
            Ambulance registration
          </Text>
          <Text style={styles.subtitle}>Add your driver and ambulance details to get started.</Text>

          <SectionTitle title="Driver and ambulance" />
          <Card>
            <DriverFormFields values={profile} onChange={setProfile} editable={!loading} />
          </Card>

          <SectionTitle title="Technician (optional)" />
          <Card>
            <TextField
              label="Full name"
              value={technicianName}
              onChangeText={setTechnicianName}
              editable={!loading}
              autoCapitalize="words"
            />
            <TextField
              label="Mobile number"
              value={technicianPhone}
              onChangeText={setTechnicianPhone}
              editable={!loading}
              keyboardType="phone-pad"
            />
            <TextField
              label="Qualification"
              value={technicianQualification}
              onChangeText={setTechnicianQualification}
              editable={!loading}
              maxLength={100}
            />
            <TextField
              label="Certification number"
              value={technicianCertification}
              onChangeText={setTechnicianCertification}
              editable={!loading}
              maxLength={50}
            />
          </Card>

          <View style={styles.submit}>
            {error ? <ErrorBanner message={error} /> : null}
            <Button title="Submit registration" loading={loading} onPress={submit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  subtitle: { ...typography.body, marginTop: spacing.xs },
  submit: { marginTop: spacing.xl, gap: spacing.md },
});
