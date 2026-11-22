import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  buildDoctorPayload,
  buildHospitalPayload,
  extractHospitalId,
  submitDoctor,
  submitHospital,
  updateProHospitalStatus,
} from "../../../api/onboarding";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing, typography } from "../../../theme";
import { Button, Card, HeaderIconButton, IconBadge } from "../../../ui/components";
import { optionLabel } from "../../../ui/format";
import { scheduleToText } from "./ScheduleEditor";

export default function OnboardingPreview({ navigation, route }: any) {
  const form = route.params?.form || {};
  const proHospitalId = route.params?.proHospitalId;
  const payload = buildHospitalPayload(form);
  const doctorSummary = {
    name: form.doctorName,
    dateOfBirth: form.doctorDob,
    sex: form.doctorSex,
    tnmcNumber: form.tnmcNumber,
    qualifications: form.doctorQualifications,
    specialties: form.doctorSpecialties,
    emergencyConditionsHandled: form.doctorEmergencyConditions,
    yearsOfExperience: form.doctorExperience,
    consultationFee: form.doctorFee,
    availability: form.doctorAvailability,
    customTimings: form.doctorAvailability === "CUSTOM_TIMINGS" ? scheduleToText(form.doctorSchedule ?? form.doctorCustomTimings) : undefined,
    engagementType: form.doctorEngagement,
    doctorCategory: form.doctorCategory,
    phone: form.doctorPhone,
    email: form.doctorEmail,
    department: form.doctorDepartment,
    teleconsultation: form.doctorTeleconsultation,
    eSignature: typeof form.doctorESignature === "string" && form.doctorESignature.startsWith("data:image")
      ? "Signed"
      : form.doctorTeleconsultation === true ? "Not collected - needed for teleconsultation" : undefined,
  };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");

  const blue = "#1747D1";
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: "Basic Information",
      fields: [
        ["Hospital Name", payload.hospitalName],
        ["Hospital Registration Number", payload.registrationNumber],
        ["Ownership Type", payload.ownershipType],
        ["Hospital Type", payload.hospitalType],
      ],
    },
    {
      title: "Address",
      fields: [
        ["Address", payload.address?.addressLine],
        ["City", payload.address?.city],
        ["District", payload.address?.district],
        ["State", payload.address?.state],
        ["Country", payload.address?.country],
        ["Pincode", payload.address?.pincode],
      ],
    },
    {
      title: "Contact Details",
      fields: [
        ["Contact Number", payload.contactDetails?.phone],
        ["Alternate Number", payload.contactDetails?.alternatePhone],
        ["Email", payload.contactDetails?.email],
        ["Emergency Hotline", payload.contactDetails?.emergencyHotline],
        ["Website", payload.contactDetails?.website],
      ],
    },
    {
      title: "Facilities",
      fields: [
        ["General Beds", payload.facilities?.bedCapacity?.general],
        ["ICU Beds", payload.facilities?.bedCapacity?.icu],
        ["NICU Beds", payload.facilities?.bedCapacity?.nicu],
        ["Specialty Departments", payload.facilities?.specialtyDepartments],
        ["Laboratory", payload.facilities?.diagnosticUnits?.lab],
        ["Scan Centre", payload.facilities?.diagnosticUnits?.scanCentre],
        ["Lab Details", payload.facilities?.labDetails],
      ],
    },
    {
      title: "Emergency Services",
      fields: [
        ["Handles Emergencies", payload.emergencyServices?.handlesEmergencies],
        [
          "Emergency Conditions",
          payload.emergencyServices?.specialtyEmergencyConditionsHandled,
        ],
        ["Ambulance Available", payload.emergencyServices?.ambulanceAvailable],
        ["Ambulance Types", payload.emergencyServices?.ambulanceTypes],
        ["Ambulance 24x7", payload.emergencyServices?.ambulance24x7Available],
        [
          "Attach Ambulance to UDHS",
          payload.emergencyServices?.willingToAttachAmbulanceToUdhs,
        ],
      ],
    },
    {
      title: "Staff Details",
      fields: [
        ["Nursing Staff", payload.staffDetails?.nursingStaffCount],
        ["Supportive Staff", payload.staffDetails?.supportiveStaffCount],
        ["UDHS Staff", payload.staffDetails?.udhsStaff],
      ],
    },
    {
      title: "Operations",
      fields: [
        ["Pharmacy", payload.operations?.dedicatedPharmacyAvailable],
        [
          "Management Software",
          payload.operations?.hospitalManagementSoftwareInUse,
        ],
        ["Hospital Insured Against Damage", payload.operations?.hospitalInsured],
        [
          "Insurance Companies Accepted for Patients",
          payload.operations?.empanelledInsuranceCompanies,
        ],
        ["Scans", payload.operations?.scansAvailable],
      ],
    },
    {
      title: "Surgical Network",
      fields: Object.entries(payload.surgicalNetwork || {}).map(
        ([key, value]) => [
          key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (letter) => letter.toUpperCase()),
          value,
        ],
      ),
    },
    {
      title: "Doctor Details",
      fields: Object.entries(doctorSummary).map(([key, value]) => [
        (
          {
            name: "Doctor Name",
            dateOfBirth: "Date of Birth",
            sex: "Sex",
            tnmcNumber: "Doctor Registration Number",
            qualifications: "Qualifications",
            specialties: "Specialties",
            emergencyConditionsHandled: "Emergency Conditions Handled",
            yearsOfExperience: "Years of Experience",
            consultationFee: "Consultation Fee",
            availability: "Availability",
            customTimings: "Working Hours",
            engagementType: "Engagement Type",
            doctorCategory: "Doctor Category",
            phone: "Mobile Number",
            email: "Email",
            department: "Department",
            teleconsultation: "Provides Teleconsultation",
            eSignature: "E-signature",
          } as Record<string, string>
        )[key] ||
          key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        value,
      ]),
    },
  ];

  const humanizeKey = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (letter) => letter.toUpperCase());

  const formatValue = (value: unknown): string => {
    if (value === true) return "Yes";
    if (value === false) return "No";

    if (value === undefined || value === null || value === "") {
      return "Not provided";
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return "Not provided";

      return value
        .map((item: unknown) => {
          if (typeof item === "object" && item !== null) {
            return Object.entries(item as Record<string, unknown>)
              .map(
                ([key, itemValue]) =>
                  `${humanizeKey(key)}: ${formatValue(itemValue)}`,
              )
              .join(" | ");
          }

          return formatValue(item);
        })
        .join("\n");
    }

    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);

      if (entries.length === 0) return "Not provided";

      return entries
        .map(
          ([key, itemValue]) =>
            `${humanizeKey(key)}: ${formatValue(itemValue)}`,
        )
        .join("\n");
    }

    return optionLabel(value);
  };
  const submitOnboarding = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError("");

    const submissionIdentity = String(
      proHospitalId ||
        form.registrationNumber ||
        form.hospitalName ||
        "new-hospital",
    )
      .trim()
      .toLowerCase();
    const pendingKey = `pro:onboarding:pending:${submissionIdentity}`;

    try {
      type PendingSubmission = {
        hospitalId: string;
        hospitalResponse: unknown;
        doctorResponse?: unknown;
        doctorSubmitted: boolean;
      };

      let pending: PendingSubmission | null = null;
      const savedPending = await AsyncStorage.getItem(pendingKey);

      if (savedPending) {
        try {
          pending = JSON.parse(savedPending) as PendingSubmission;
        } catch {
          // Ignore invalid saved state; a fresh submission will be attempted.
          await AsyncStorage.removeItem(pendingKey);
        }
      }

      // 1. Create the hospital only if a successful hospital ID is not saved.
      setStage("Creating the hospital…");
      if (!pending?.hospitalId) {
        const hospitalResponse = await submitHospital(payload);
        const hospitalId = extractHospitalId(hospitalResponse);

        if (!hospitalId) {
          console.warn("Hospital created but no ID found in response:", hospitalResponse);
          throw new Error(
            "Hospital submission did not return a hospital ID. Doctor registration was not submitted. Please verify the hospital record before retrying.",
          );
        }

        pending = {
          hospitalId,
          hospitalResponse,
          doctorSubmitted: false,
        };

        // Persist immediately after hospital success. A doctor failure can
        // then retry without calling submitHospital() again.
        await AsyncStorage.setItem(pendingKey, JSON.stringify(pending));
      }

      if (!pending?.hospitalId) {
        throw new Error(
          "A saved hospital ID is required before doctor registration.",
        );
      }

      // 2. Register the doctor only after hospital creation succeeds.
      setStage("Registering the doctor…");
      // If doctor registration already succeeded in a previous attempt, skip it.
      if (!pending.doctorSubmitted) {
        const doctorPayload = buildDoctorPayload(form, pending.hospitalId);
        const doctorResponse = await submitDoctor(doctorPayload);

        pending = {
          ...pending,
          doctorResponse,
          doctorSubmitted: true,
        };

        // Save doctor success before attempting the PRO status update.
        await AsyncStorage.setItem(pendingKey, JSON.stringify(pending));
      }

      // 3. Mark the PRO lead onboarded and link it to the created hospital.
      setStage("Linking the hospital to you…");
      if (proHospitalId) {
        await updateProHospitalStatus(proHospitalId, {
          status: "ONBOARDED",
          hospitalId: pending.hospitalId,
        });
      }

      const completedPending = pending;
      await AsyncStorage.removeItem(pendingKey);
      // The form draft for this hospital is finished - drop it.
      await AsyncStorage.removeItem(`pro:onboarding:draft:${proHospitalId || "new"}`).catch(() => {});

      navigation.replace("OnboardingApproval", {
        proHospitalId,
        hospitalResponse: completedPending.hospitalResponse,
        doctorResponse: completedPending.doctorResponse,
      });
    } catch (submissionError: unknown) {
      console.error("PRO onboarding submission failed:", submissionError);
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Submission incomplete. Your progress has been retained. Please retry.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Which form step each review section edits (hospitalFields order).
  const SECTION_UI: Record<string, { step: number; icon: any }> = {
    "Basic Information": { step: 0, icon: "id-card-outline" },
    Address: { step: 1, icon: "location-outline" },
    "Contact Details": { step: 2, icon: "call-outline" },
    Facilities: { step: 3, icon: "medkit-outline" },
    "Emergency Services": { step: 4, icon: "pulse-outline" },
    "Staff Details": { step: 5, icon: "people-outline" },
    Operations: { step: 6, icon: "settings-outline" },
    "Surgical Network": { step: 7, icon: "cut-outline" },
    "Doctor Details": { step: 8, icon: "person-add-outline" },
  };

  const editSection = (step: number) =>
    navigation.navigate({ name: "HospitalOnboarding", params: { jumpTo: step, jumpAt: Date.now() }, merge: true });

  const totalBeds =
    (payload.facilities?.bedCapacity?.general || 0) +
    (payload.facilities?.bedCapacity?.icu || 0) +
    (payload.facilities?.bedCapacity?.nicu || 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <HeaderIconButton icon="arrow-back" label="Back to form" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={typography.heading}>Review and submit</Text>
          <Text style={typography.caption}>Check everything before it goes to Uyir</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Card style={{ backgroundColor: colors.brand, borderColor: colors.brand }}>
          <Text style={[typography.overline, { color: colors.brandOnDark }]}>ONBOARDING</Text>
          <Text style={{ color: colors.white, fontSize: 20, fontWeight: "800", marginTop: 4 }} numberOfLines={2}>
            {payload.hospitalName || "Hospital"}
          </Text>
          <Text style={{ color: colors.brandOnDark, fontSize: 13, marginTop: 4 }}>
            {[optionLabel(payload.hospitalType), payload.address?.city, payload.address?.district].filter(Boolean).join(" · ")}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.xl, marginTop: spacing.lg }}>
            <HeroFact label="Beds" value={String(totalBeds)} />
            <HeroFact label="Departments" value={String(payload.facilities?.specialtyDepartments?.length || 0)} />
            <HeroFact label="Emergency" value={payload.emergencyServices?.handlesEmergencies ? "Yes" : "No"} />
          </View>
        </Card>

        <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Tap <Text style={{ color: colors.brand, fontWeight: "700" }}>Edit</Text> on any section to change it. Your answers are kept.
        </Text>

        {sections.map((sectionItem) => {
          const ui = SECTION_UI[sectionItem.title];
          return (
            <Card key={sectionItem.title} style={{ marginBottom: spacing.md, padding: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, paddingBottom: spacing.md }}>
                <IconBadge icon={ui?.icon || "document-text-outline"} size={36} />
                <Text style={[typography.heading, { flex: 1, marginLeft: spacing.md }]}>{sectionItem.title}</Text>
                {ui ? (
                  <Pressable
                    onPress={() => editSection(ui.step)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${sectionItem.title}`}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.brandSoft }}
                  >
                    <Ionicons name="create-outline" size={14} color={colors.brand} />
                    <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 12 }}>Edit</Text>
                  </Pressable>
                ) : null}
              </View>
              {sectionItem.fields.map(([label, value]: any, index: number) => {
                const text = formatValue(value);
                const empty = text === "Not provided";
                const valueColor = empty ? colors.muted : text === "Yes" ? colors.green : text === "No" ? colors.textSecondary : colors.text;
                return (
                  <View key={`${label}-${index}`} style={{ flexDirection: "row", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, gap: spacing.md }}>
                    <Text style={[typography.caption, { width: "42%", color: colors.textSecondary, fontWeight: "600" }]}>{label}</Text>
                    <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, fontWeight: empty ? "400" : "600", color: valueColor }}>{text}</Text>
                  </View>
                );
              })}
            </Card>
          );
        })}

        <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.brandSoft, borderRadius: radius.md }}>
          <Ionicons name="information-circle" size={18} color={colors.brand} />
          <Text style={[typography.caption, { flex: 1, color: colors.textSecondary, lineHeight: 17 }]}>
            Submitting creates the hospital, registers the doctor and marks this hospital as onboarded by you. If a step fails, your progress is kept and you can retry.
          </Text>
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md + insets.bottom, borderTopWidth: 1, borderTopColor: colors.divider, ...shadow.floating }}>
        {error ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.redSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }}>
            <Ionicons name="alert-circle" size={18} color={colors.red} />
            <Text style={{ flex: 1, color: colors.red, fontSize: 13, fontWeight: "600", lineHeight: 18 }}>{error}</Text>
          </View>
        ) : null}
        <Button
          label={submitting ? stage || "Submitting…" : error ? "Retry submission" : "Submit onboarding"}
          icon={error ? "refresh" : "cloud-upload-outline"}
          onPress={submitOnboarding}
          loading={submitting}
        />
        {submitting && stage ? <Text style={[typography.caption, { textAlign: "center", marginTop: 6 }]}>{stage}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: colors.brandOnDark, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
