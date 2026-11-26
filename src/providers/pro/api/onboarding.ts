import { File } from "expo-file-system";
import { HOSPITAL_API_URL } from "../config/env";
import { getProUserId, proApi, proAuthHeader, proUrl } from "./client";
import { authFetch, getAccessToken, getAuthUserId, getAuthRole } from "../../../auth/session";
import { scheduleToText } from "../features/onboarding/components/ScheduleEditor";

export async function uploadProHospitalImages(
  proHospitalId: string,
  image1: string,
  image2: string,
) {
  const body = new FormData();

  const hospitalPhoto = new File(image1);
  const proHospitalPhoto = new File(image2);

  body.append("image1", hospitalPhoto);
  body.append("image2", proHospitalPhoto);

  const userId = getProUserId();

  if (!userId) {
    throw new Error("PRO user ID not available. Please login again.");
  }

  console.log("========== PRO IMAGE UPLOAD ==========");
  console.log("proHospitalId:", proHospitalId);
  console.log("image1:", image1);
  console.log("image2:", image2);
  const imagesUrl = proUrl(`/pro/hospital/${proHospitalId}/images`);
  console.log("URL:", imagesUrl);

  const response = await authFetch(
    imagesUrl,
    {
      method: "PATCH",
      headers: {
        ...proAuthHeader(),
        "x-user-id": userId,
      },
      body,
    },
  );

  console.log("Upload status:", response.status);
  console.log("Upload status text:", response.statusText);

  const rawResponse = await response.text();

  console.log("Upload raw response:", rawResponse);

  let data = null;

  try {
    data = JSON.parse(rawResponse);
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error?.message ||
        rawResponse ||
        `Image upload failed with status ${response.status}`,
    );
  }

  return data;
}
export function updateProHospitalStatus(
  proHospitalId: string,
  data: {
    status: string;
    reason?: string;
    hospitalId?: string;
  },
) {
  return proApi(`/pro/hospital/${proHospitalId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function submitHospital(payload: any) {
  const token = getAccessToken();
  const userId = getAuthUserId();
  const role = getAuthRole();
  const url = `${HOSPITAL_API_URL}/api/v1/hospital`;
  if (!token || !userId) throw new Error("Please log in again before submitting hospital details.");
  const response = await authFetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-User-Id": userId, "X-User-Role": role || "PRO" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error: any = new Error(data?.error?.message || data?.message || `Hospital API returned ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data?.data ?? data;
}

/**
 * Email the hospital a new claim code (the old one stops working). Only the PRO who onboarded the
 * hospital may do this; the hospital service allows one resend a minute. Returns the hospital, whose
 * `claimCodeSentTo` / `claimCodeExpiresAt` describe the new code.
 */
export async function resendHospitalClaimCode(hospitalId: string) {
  const token = getAccessToken();
  const userId = getAuthUserId();
  if (!token || !userId) throw new Error("Please log in again.");
  const response = await authFetch(`${HOSPITAL_API_URL}/api/v1/hospital/${encodeURIComponent(hospitalId)}/claim-code/resend`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "X-User-Id": userId, "X-User-Role": getAuthRole() || "PRO" },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error: any = new Error(data?.message || data?.error?.message || `Couldn't resend the claim code (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data?.data ?? data;
}

/**
 * GET /api/v1/hospital/{id} - the hospital record created at onboarding (address,
 * contact details, facilities...). The PRO service only keeps its id.
 */
export async function getHospitalById(hospitalId: string) {
  const token = getAccessToken();
  const userId = getAuthUserId();
  const response = await authFetch(`${HOSPITAL_API_URL}/api/v1/hospital/${encodeURIComponent(hospitalId)}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { "X-User-Id": userId, "X-User-Role": getAuthRole() || "PRO" } : {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error?.message || `Hospital API returned ${response.status}`);
  return data?.data ?? data;
}

/**
 * The hospital API returns the full created hospital record (optionally wrapped
 * in `data` / `hospital`). Pull its ID from whichever field the backend uses.
 */
export function extractHospitalId(response: any): string {
  const candidates = [response, response?.data, response?.hospital, response?.data?.hospital];
  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;
    const id = item.hospitalId ?? item._id ?? item.id;
    if (id !== undefined && id !== null && String(id).trim()) return String(id).trim();
  }
  return "";
}

export async function submitDoctor(payload: any) {
  const token = getAccessToken();
  const userId = getAuthUserId();
  const role = getAuthRole();
  if (!token || !userId) throw new Error("Please log in again before submitting doctor details.");
  const url = `${HOSPITAL_API_URL}/api/v1/hospital/doctors`;
  const response = await authFetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-User-Id": userId, "X-User-Role": role || "PRO" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error: any = new Error(data?.error?.message || data?.message || `Doctor API returned ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data?.data ?? data;
}

export async function getOnboardingMaster(path: "specialties" | "emergency-conditions") {
  const response = await fetch(`${HOSPITAL_API_URL}/api/v1/hospital/${path}`, { headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Unable to load ${path}`);
  const value = data?.data ?? data;
  return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
}

/** Whole years since a YYYY-MM-DD date of birth, or undefined if it isn't one. */
export function ageFromDob(value: any, today = new Date()): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return undefined;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age >= 0 && age < 120 ? age : undefined;
}

function toNumber(value: any) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function toArray(value: any) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function selectedOrOther(value: any, otherValue: any) {
  return value === "Other" ? String(otherValue || "").trim() : value;
}

function toArrayWithOther(value: any, otherValue: any) {
  const values = toArray(value).filter((item) => item !== "Other");
  if (toArray(value).includes("Other") && String(otherValue || "").trim()) values.push(String(otherValue).trim());
  return values;
}

function toStaff(value: any) {
  if (Array.isArray(value)) {
    return value
      .map((member) => ({
        name: String(member?.name || "").trim(),
        mobileNumber: String(
          member?.mobileNumber || member?.mobile || "",
        ).trim(),
        designation: String(member?.designation === "Other" ? member?.designationOther || "" : member?.designation || "").trim(),
      }))
      .filter(
        (member) =>
          member.name || member.mobileNumber || member.designation,
      );
  }

  if (typeof value !== "string") return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", mobileNumber = "", designation = ""] = line
        .split("|")
        .map((item) => item.trim());

      return {
        name,
        mobileNumber,
        designation,
      };
    });
}

export function buildHospitalPayload(form: any) {
  const pcpndt = form.usgAvailable === true ? String(form.pcpndtRegistrationNumber || "").trim() : "";
  const payload: any = {
    hospitalName: String(form.hospitalName || "").trim(),
    registrationNumber: String(form.registrationNumber || "").trim(),
    ownershipType: selectedOrOther(form.ownershipType, form.ownershipTypeOther),
    hospitalType: selectedOrOther(form.hospitalType, form.hospitalTypeOther),
    address: {
      addressLine: String(form.addressLine || "").trim(),
      city: String(form.city || "").trim(),
      district: String(form.district || "").trim(),
      state: String(form.state || "").trim(),
      country: "India",
      pincode: String(form.pincode || "").trim(),
      ...(toNumber(form.longitude) !== undefined && toNumber(form.latitude) !== undefined ? {
        location: { type: "Point", coordinates: [toNumber(form.longitude), toNumber(form.latitude)] },
      } : {}),
    },
    contactDetails: {
      phone: String(form.phone || "").trim() ? `${String(form.phoneCountryCode || "+91")}-${String(form.phone).trim()}` : "",
      ...(String(form.alternatePhone || "").trim() ? { alternatePhone: String(form.alternatePhone).trim() } : {}),
      ...(String(form.email || "").trim() ? { email: String(form.email).trim() } : {}),
      ...(String(form.emergencyHotline || "").trim() ? { emergencyHotline: String(form.emergencyHotline).trim() } : {}),
      ...(String(form.website || "").trim() ? { website: `${form.websiteProtocol || "https://"}${String(form.website).trim().replace(/^https?:\/\//i, "")}` } : {}),
    },
    facilities: {
      bedCapacity: {
        general: toNumber(form.generalBeds) ?? 0,
        icu: toNumber(form.icuBeds) ?? 0,
        nicu: toNumber(form.nicuBeds) ?? 0,
      },
      specialtyDepartments: toArrayWithOther(form.specialtyDepartments, form.specialtyDepartmentsOther),
      diagnosticUnits: {
        lab: form.labAvailable === true,
        scanCentre: form.scanCentreAvailable === true,

      },
      ...((form.labAvailable === true || form.scanCentreAvailable === true || pcpndt) ? { labDetails: {
        ...(form.labAvailable === true ? { labName: String(form.labName || "").trim(), qualification: String(selectedOrOther(form.labQualification, form.labQualificationOther) || "").trim(), facilities: toArrayWithOther(form.labFacilities, form.labFacilitiesOther) } : {}),
        ...(form.scanCentreAvailable === true ? { scanCentreName: String(form.scanCentreName || "").trim() } : {}),
        // Asked only when the hospital has USG (PCPNDT Act); dropped if USG was later set to No.
        ...(pcpndt ? { pcpndtRegistrationNumber: pcpndt } : {}),
      } } : {}),
    },
    emergencyServices: {
      handlesEmergencies: form.handlesEmergencies === true,
      ...(form.handlesEmergencies === true ? { specialtyEmergencyConditionsHandled: toArrayWithOther(form.specialtyEmergencyConditionsHandled, form.specialtyEmergencyConditionsHandledOther) } : {}),
      ambulanceAvailable: form.ambulanceAvailable === true,
      ...(form.ambulanceAvailable === true ? { ambulanceTypes: toArrayWithOther(form.ambulanceTypes, form.ambulanceTypesOther), ambulance24x7Available: form.ambulance24x7Available === true, willingToAttachAmbulanceToUdhs: form.willingToAttachAmbulanceToUdhs === true } : {}),
    },
    staffDetails: {
      nursingStaffCount: toNumber(form.nursingStaffCount) ?? 0,
      supportiveStaffCount: toNumber(form.supportiveStaffCount) ?? 0,
      udhsStaff: toStaff(form.udhsStaff),
    },
    operations: {
      hospitalInsured: form.hospitalInsured === true,
      dedicatedPharmacyAvailable: form.dedicatedPharmacyAvailable === true,
      hospitalManagementSoftwareInUse:
        form.hospitalManagementSoftwareInUse === true,
      empanelledInsuranceCompanies: toArrayWithOther(form.empanelledInsuranceCompanies, form.empanelledInsuranceCompaniesOther),
      scansAvailable: {
        usg: form.usgAvailable === true,
        xray: form.xrayAvailable === true,
        ct: form.ctAvailable === true,
        mri: form.mriAvailable === true,
        other: toArrayWithOther(form.otherScans, form.otherScansOther),
      },
    },
    surgicalNetwork: {
      joinedSurgicalNetwork: form.joinedSurgicalNetwork === true,
      ...(form.joinedSurgicalNetwork === true ? {
        operationTheatreCount: toNumber(form.operationTheatreCount) ?? 0,
        laserEquipmentAvailable: form.laserEquipmentAvailable === true,
        minimallyInvasiveEquipmentAvailable: form.minimallyInvasiveEquipmentAvailable === true,
        postOpRecoveryRoomAvailable: form.postOpRecoveryRoomAvailable === true,
        endoscopyAvailable: form.endoscopyAvailable === true,
        laparoscopyUnitsAvailable: form.laparoscopyUnitsAvailable === true,
      } : {}),
    },
  };

  return payload;
}


export function buildDoctorPayload(form: any, hospitalId: string) {
  const specialties = toArrayWithOther(form.doctorSpecialties, form.doctorSpecialtiesOther);
  const hospitalEmergencyConditions = toArray(form.specialtyEmergencyConditionsHandled);
  const emergencyConditions = toArrayWithOther(form.doctorEmergencyConditions, form.doctorEmergencyConditionsOther).filter((item) => hospitalEmergencyConditions.includes(item) || item === String(form.doctorEmergencyConditionsOther || "").trim());
  const qualifications = toArrayWithOther(form.doctorQualifications, form.doctorQualificationsOther);
  const fee = toNumber(form.doctorFee);
  // The hospital service's DoctorRequest stores `age`, not a date of birth -
  // a dateOfBirth field alone is silently dropped. Send both.
  const age = ageFromDob(form.doctorDob);
  const eSign = typeof form.doctorESignature === "string" && form.doctorESignature.startsWith("data:image") ? form.doctorESignature : "";
  return {
    name: String(form.doctorName || "").trim(),
    ...(age !== undefined ? { age } : {}),
    ...(String(form.doctorDob || "").trim() ? { dateOfBirth: String(form.doctorDob).trim() } : {}),
    sex: form.doctorSex,
    tnmcNumber: String(form.tnmcNumber || "").trim(),
    qualifications,
    specialties,
    emergencyConditionsHandled: emergencyConditions,
    ...(toNumber(form.doctorExperience) !== undefined ? { yearsOfExperience: toNumber(form.doctorExperience) } : {}),
    ...(fee !== undefined ? { consultationFee: fee } : {}),
    availability: { type: form.doctorAvailability || "CUSTOM_TIMINGS", ...(form.doctorAvailability === "CUSTOM_TIMINGS" ? { customTimings: scheduleToText(form.doctorSchedule ?? form.doctorCustomTimings) } : {}) },
    engagementType: form.doctorEngagement,
    ...(form.doctorCategory ? { doctorCategory: form.doctorCategory } : {}),
    // Drawn signature as a PNG data URL (there is no file upload endpoint).
    // Lombok's eSignDocumentUrl may bind as "esignDocumentUrl" under Jackson;
    // the server ignores whichever key it doesn't use.
    ...(eSign ? { eSignDocumentUrl: eSign, esignDocumentUrl: eSign } : {}),
    contactDetails: { phone: String(form.doctorPhone || "").trim() ? `${String(form.phoneCountryCode || "+91")}-${String(form.doctorPhone).trim()}` : "", ...(form.doctorEmail ? { email: String(form.doctorEmail).trim() } : {}) },
    hospitalAssociations: [{ hospitalId, department: String(selectedOrOther(form.doctorDepartment, form.doctorDepartmentOther) || specialties[0] || "").trim(), ...(fee !== undefined ? { consultationFee: fee } : {}), active: true }],
  };
}
