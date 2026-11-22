import type { Tone } from "./components";

/**
 * Hospital pool rows store "NAME, street, town, Tamilnadu-627751" in one
 * `name` field (the TNCERA Excel's "Name and Address" column). Split it so the
 * name can be the title and the rest the address line.
 */
export function splitHospitalName(raw?: string | null, address?: string | null) {
  const text = String(raw || "").replace(/\s+/g, " ").trim();
  if (!text) return { title: "Unnamed hospital", subtitle: address || "" };
  if (address) return { title: text, subtitle: address };
  const comma = text.indexOf(",");
  if (comma <= 0) return { title: text, subtitle: "" };
  return { title: text.slice(0, comma).trim(), subtitle: text.slice(comma + 1).trim() };
}

/** "Abdul Khan" -> "AK" */
export function initials(name?: string | null) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PR";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "")).toUpperCase();
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Remaining time until `iso`, for countdown chips. */
export function timeLeft(iso: string | null | undefined, now = Date.now()) {
  const target = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(target)) return { ms: 0, expired: false, unknown: true, label: "No deadline" };
  const ms = target - now;
  if (ms <= 0) return { ms: 0, expired: true, unknown: false, label: "Time's up" };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const label = h > 0 ? `${h}h ${String(m).padStart(2, "0")}m left` : `${m}m ${String(s).padStart(2, "0")}s left`;
  return { ms, expired: false, unknown: false, label };
}

/** Countdown colour: calm with time to spare, amber under 6h, red under 1h. */
export function urgencyTone(ms: number, expired: boolean): Tone {
  if (expired) return "red";
  if (ms < 3_600_000) return "red";
  if (ms < 6 * 3_600_000) return "amber";
  return "green";
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  PICKED: { label: "Picked", tone: "brand" },
  NO_TIME: { label: "Revisit later", tone: "amber" },
  ONBOARDED: { label: "Onboarded", tone: "green" },
  HOSPITAL_REJECTED: { label: "Not interested", tone: "red" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  RELEASED: { label: "Released", tone: "neutral" },
  BLOCKED: { label: "Blocked", tone: "neutral" },
  ADMIN_HOLD: { label: "On hold", tone: "violet" },
};

export function statusInfo(status?: string | null) {
  const key = String(status || "").toUpperCase();
  return STATUS[key] || { label: key ? key.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "Unknown", tone: "neutral" as Tone };
}

/**
 * Human labels for the hospital service's enum codes (B:/uyir/hospitalservice
 * model/enums). The form still submits the codes; only the display changes.
 */
const OPTION_LABELS: Record<string, string> = {
  PRIVATE: "Private",
  TRUST: "Trust",
  CLINIC: "Clinic",
  NURSING_HOME: "Nursing home",
  HOSPITAL: "Hospital",
  SUPER_SPECIALITY: "Super speciality hospital",
  MEDICAL_COLLEGE: "Medical college hospital",
  NORMAL: "Normal ambulance",
  BLS: "BLS - Basic Life Support",
  VENTILATOR: "Ventilator ambulance",
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  REGULAR: "Regular",
  ON_CALL: "On call",
  PRIMARY: "Primary",
  FREELANCER: "Freelancer",
  CUSTOM_TIMINGS: "Custom timings",
  WHATSAPP_BUSINESS_HOURS: "WhatsApp business hours",
};

export function optionLabel(value: unknown): string {
  const text = String(value ?? "");
  return OPTION_LABELS[text] || text;
}

/**
 * Fields whose values are Java enums on the hospital service. They must never
 * offer a free-text "Other" - an unknown value makes the whole hospital (or
 * doctor) submission fail with 400.
 */
export const ENUM_FIELDS = new Set([
  "ownershipType",
  "hospitalType",
  "ambulanceTypes",
  "doctorSex",
  "doctorAvailability",
  "doctorEngagement",
  "doctorCategory",
  "websiteProtocol",
  // Validated against the hospital service's master catalogs
  // (specialties.json - 131 entries, emergency-conditions.json - 16); any
  // other value fails the request. The app's lists match them code for code.
  "specialtyDepartments",
  "specialtyEmergencyConditionsHandled",
  "doctorSpecialties",
  "doctorEmergencyConditions",
]);

/** Pulls the proId out of GET /pro/me, whatever envelope it comes in. */
export function proIdFrom(profileResponse: any): string {
  const p = profileResponse?.data || profileResponse || {};
  return p?.proId || p?.pro?.proId || p?.id || "";
}
