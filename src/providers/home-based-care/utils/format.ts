import type { Booking, BookingStatus, CareType } from "../api/types";

export const CARE_TYPE_LABEL: Record<CareType, string> = {
  NURSE: "Nursing Care",
  PHYSIO: "Physiotherapy",
  CARETAKER: "Caretaker",
};

export const CARE_TYPE_ICON: Record<CareType, string> = {
  NURSE: "medkit",
  PHYSIO: "body",
  CARETAKER: "heart",
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Open",
  ACCEPTED: "Accepted",
  CONFIRMED: "Awaiting payment",
  PAID: "Ready to visit",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function careTypeLabel(type?: string | null) {
  return (type && CARE_TYPE_LABEL[type as CareType]) || "Home-Based Care";
}

export function rupees(amount?: number | null) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function dateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function distance(km?: number | null) {
  if (km == null) return "In your pincode";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function serviceName(b: Booking) {
  return b.service?.name || careTypeLabel(b.careType);
}

export function patientName(b: Booking) {
  return b.patient?.fullName || "Patient";
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
}
