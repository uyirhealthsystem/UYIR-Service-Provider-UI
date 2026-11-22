import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import type { Tone } from "./components";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Indian digit grouping: 1234567.5 -> "₹12,34,567.50". */
export function money(value: unknown, { decimals = 2 }: { decimals?: number } = {}) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  const [int, frac] = Math.abs(safe).toFixed(decimals).split(".");
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `${safe < 0 ? "-" : ""}₹${grouped}${frac ? `.${frac}` : ""}`;
}

export function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parse(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "21 Nov 2026" */
export function formatDate(iso?: string | null) {
  const d = parse(iso);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "-";
}

/** "21 Nov 2026, 4:05 PM" */
export function formatDateTime(iso?: string | null) {
  const d = parse(iso);
  if (!d) return "-";
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  return `${formatDate(iso)}, ${time}`;
}

/** "Abdul Khan" -> "AK" */
export function initials(name?: string | null) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HP";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "")).toUpperCase();
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Referrals carry only the referred user's id: show its tail, not the whole uuid. */
export function shortId(id?: string | null) {
  const value = String(id || "");
  return value.length > 8 ? `#${value.slice(-6).toUpperCase()}` : value ? `#${value.toUpperCase()}` : "-";
}

export function listFrom<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export type ReferralStatus = "COMPLETED" | "PENDING" | "CANCELLED";

export function referralStatus(raw?: string | null): ReferralStatus {
  const value = String(raw || "PENDING").toUpperCase();
  if (value === "COMPLETED") return "COMPLETED";
  if (value === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

export const REFERRAL_STATUS: Record<ReferralStatus, { label: string; tone: Tone; icon: IconName }> = {
  COMPLETED: { label: "Completed", tone: "green", icon: "checkmark-circle" },
  PENDING: { label: "Pending", tone: "amber", icon: "time" },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: "close-circle" },
};

export function referralType(raw?: string | null) {
  return String(raw || "").toUpperCase() === "HEALTH_PARTNER"
    ? { label: "Health Partner", icon: "people" as IconName, tone: "blue" as Tone }
    : { label: "Citizen", icon: "person" as IconName, tone: "brand" as Tone };
}

export function withdrawalStatus(raw?: string | null): { label: string; tone: Tone } {
  const value = String(raw || "PENDING").toUpperCase();
  if (["COMPLETED", "PROCESSED", "PAID", "SUCCESS"].includes(value)) return { label: "Paid", tone: "green" };
  if (["REJECTED", "FAILED", "CANCELLED"].includes(value)) return { label: "Failed", tone: "red" };
  if (value === "PROCESSING") return { label: "Processing", tone: "blue" };
  return { label: "Requested", tone: "amber" };
}

// ---- Date of birth: people type DD/MM/YYYY, the API wants YYYY-MM-DD.

/** Auto-inserts slashes while typing: "2105199" -> "21/05/199". */
export function maskDob(text: string) {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}

/** "1990-05-21" -> "21/05/1990" */
export function dobToDisplay(iso?: string | null) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** "21/05/1990" -> "1990-05-21", or null when it isn't a real past date (age 18-100). */
export function dobToIso(display: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < 18 || age > 100) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export const GENDERS = [
  { id: "FEMALE", name: "Female" },
  { id: "MALE", name: "Male" },
  { id: "OTHER", name: "Other" },
];

export const genderLabel = (id?: string | null) => GENDERS.find((g) => g.id === id)?.name || "";

/** Indian mobile: 10 digits, optional +91 / 91 / 0 prefix stripped. */
export function normalizePhone(text: string) {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export const isValidPhone = (text: string) => /^[6-9]\d{9}$/.test(normalizePhone(text));
export const isValidEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
export const isValidPincode = (text: string) => /^[1-9]\d{5}$/.test(text.trim());
