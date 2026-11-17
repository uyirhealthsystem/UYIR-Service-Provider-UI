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
  submitDoctor,
  submitHospital,
  updateProHospitalStatus,
} from "../../../api/onboarding";

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
    customTimings: form.doctorCustomTimings,
    engagementType: form.doctorEngagement,
    doctorCategory: form.doctorCategory,
    phone: form.doctorPhone,
    email: form.doctorEmail,
    department: form.doctorDepartment,
  };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const blue = "#1747D1";
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: "Basic Information",
      fields: [
        ["Hospital Name", payload.hospitalName],
        [
          "Hospital Insured Against Damage",
          payload.operations?.hospitalInsured,
        ],
        ["Registration Number", payload.registrationNumber],
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
            tnmcNumber: "TNMC Registration Number",
            qualifications: "Qualifications",
            specialties: "Specialties",
            emergencyConditionsHandled: "Emergency Conditions Handled",
            yearsOfExperience: "Years of Experience",
            consultationFee: "Consultation Fee",
            availability: "Availability",
            customTimings: "Custom Timings",
            engagementType: "Engagement Type",
            doctorCategory: "Doctor Category",
            phone: "Mobile Number",
            email: "Email",
            department: "Department",
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

    return String(value);
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
      if (!pending?.hospitalId) {
        const hospitalResponse = await submitHospital(payload);
        const response = hospitalResponse as any;
        const hospitalId = String(
          response?.id ??
            response?.hospitalId ??
            response?.hospital?.id ??
            response?.data?.id ??
            response?.data?.hospitalId ??
            response?.data?.hospital?.id ??
            "",
        ).trim();

        if (!hospitalId) {
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

      // 3. Update the PRO lead only after hospital and doctor succeed.
      if (proHospitalId) {
        await updateProHospitalStatus(proHospitalId, {
          status: "ONBOARDED",
        });
      }

      const completedPending = pending;
      await AsyncStorage.removeItem(pendingKey);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E4E8F0",
          paddingHorizontal: 16,
          paddingTop: 7,
          paddingBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              backgroundColor: "#F5F7FB",
              borderWidth: 1,
              borderColor: "#E3E7EF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 23, color: "#171A2B", marginTop: -2 }}>
              ‹
            </Text>
          </Pressable>

          <View style={{ flex: 1, marginLeft: 11 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#171A2B" }}>
              Review Details
            </Text>
            <Text style={{ fontSize: 11, color: "#73798C", marginTop: 2 }}>
              Check everything before submitting
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#EAF1FF",
              borderRadius: 8,
              paddingHorizontal: 9,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: blue }}>
              REVIEW
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 130 + insets.bottom,
        }}
      >
        <View
          style={{
            backgroundColor: "#EAF1FF",
            borderRadius: 11,
            padding: 13,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: blue, fontSize: 17, fontWeight: "700" }}>
              ✓
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: blue }}>
              Ready for submission
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: "#596074",
                marginTop: 3,
                lineHeight: 16,
              }}
            >
              Please verify the information collected from the hospital.
            </Text>
          </View>
        </View>

        {sections.map((section) => (
          <View
            key={section.title}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              borderWidth: 1,
              borderColor: "#E3E7EF",
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                backgroundColor: "#FAFBFD",
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderBottomWidth: 1,
                borderBottomColor: "#E9ECF2",
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: "#171A2B" }}
              >
                {section.title}
              </Text>
            </View>

            {section.fields.map(([label, value]: any, index: number) => (
              <View
                key={`${label}-${index}`}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderBottomWidth:
                    index === section.fields.length - 1 ? 0 : 1,
                  borderBottomColor: "#F0F2F6",
                }}
              >
                <Text style={{ fontSize: 10, color: "#8A91A2" }}>{label}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#34394A",
                    fontWeight: "600",
                    marginTop: 3,
                  }}
                >
                  {formatValue(value)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {error ? (
          <View
            style={{
              backgroundColor: "#FFF0F1",
              borderRadius: 9,
              padding: 11,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 11, color: "#C62828", fontWeight: "600" }}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E6E9F0",
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 12 + insets.bottom,
        }}
      >
        <Pressable
          disabled={submitting}
          onPress={submitOnboarding}
          style={{
            height: 50,
            borderRadius: 9,
            backgroundColor: submitting ? "#8DA5E8" : blue,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
              Submit Onboarding
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
