import type {
  AmbulanceType,
  Booking,
  BookingStatus,
  Coordinate,
  DriverProfileRequest,
  DriverStatus,
  EmergencyType,
  Place,
} from "../types";

// Validation rules enforced by the ambulance service.
export const OTP_LENGTH = 4;
export const MAX_TECHNICIANS = 5;
const PHONE_PATTERN = /^\+?\d{10,13}$/;
const PLATE_MIN_LENGTH = 4;
const PLATE_MAX_LENGTH = 15;

export const AMBULANCE_TYPES: { value: AmbulanceType; label: string }[] = [
  { value: "TRANSPORT", label: "Transport" },
  { value: "BLS", label: "BLS" },
  { value: "ALS", label: "ALS" },
  { value: "ICU", label: "ICU" },
];

const EMERGENCY_LABELS: Record<EmergencyType, string> = {
  CARDIAC: "Cardiac emergency",
  ACCIDENT: "Accident",
  BREATHING: "Breathing difficulty",
  STROKE: "Stroke",
  PREGNANCY: "Pregnancy",
  OTHER: "Other emergency",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  SCHEDULED: "Scheduled",
  SEARCHING: "Searching",
  EN_ROUTE_TO_PICKUP: "En route",
  ARRIVED: "Arrived",
  PICKED_UP: "Picked up",
  PAYMENT_PENDING: "Awaiting payment",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_AMBULANCE_FOUND: "Not assigned",
};

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_TONES: Record<BookingStatus, StatusTone> = {
  SCHEDULED: "info",
  SEARCHING: "info",
  EN_ROUTE_TO_PICKUP: "info",
  ARRIVED: "info",
  PICKED_UP: "info",
  PAYMENT_PENDING: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_AMBULANCE_FOUND: "neutral",
};

export type TripPhase = "TO_PATIENT" | "AT_PATIENT" | "TO_HOSPITAL" | "DROPPED";

export function tripPhase(status: BookingStatus): TripPhase {
  switch (status) {
    case "ARRIVED":
      return "AT_PATIENT";
    case "PICKED_UP":
      return "TO_HOSPITAL";
    case "PAYMENT_PENDING":
    case "COMPLETED":
      return "DROPPED";
    default:
      return "TO_PATIENT";
  }
}

/** BUSY drivers are on a trip, so they still count as online. */
export function isDriverOnline(status: DriverStatus | undefined): boolean {
  return status === "AVAILABLE" || status === "BUSY";
}

export function toCoordinate(place: Place | null | undefined): Coordinate | null {
  if (!place) return null;
  const { lat, lng } = place;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

/** Phones report -1 when the heading is unknown, and the server rejects values outside 0-360. */
export function validHeading(heading: number | null | undefined): number | undefined {
  if (heading == null || !Number.isFinite(heading)) return undefined;
  return heading >= 0 && heading <= 360 ? heading : undefined;
}

export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone);
}

export function isValidPlate(plate: string): boolean {
  return plate.length >= PLATE_MIN_LENGTH && plate.length <= PLATE_MAX_LENGTH;
}

export function sumFares(bookings: Pick<Booking, "fare">[]): number {
  return bookings.reduce((total, booking) => total + Number(booking.fare ?? 0), 0);
}

export function formatMoney(amount: number | null | undefined): string {
  return `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
}

export function pickupAddress(place: Place | null | undefined): string {
  return place?.address || "Patient pickup location";
}

export function dropAddress(place: Place | null | undefined): string {
  if (!place) return "No hospital chosen";
  return place.address || "Hospital destination";
}

export function emergencyLabel(type: EmergencyType | null | undefined): string | null {
  return type ? EMERGENCY_LABELS[type] : null;
}

export function statusLabel(status: BookingStatus): string {
  return STATUS_LABELS[status];
}

export function statusTone(status: BookingStatus): StatusTone {
  return STATUS_TONES[status];
}

export function ambulanceTypeLabel(type: AmbulanceType | null | undefined): string {
  return AMBULANCE_TYPES.find((option) => option.value === type)?.label ?? "Ambulance";
}

/** Whole seconds left, never negative. */
export function secondsUntil(isoDate: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(isoDate) - now) / 1000)) || 0;
}

export function validateDriverProfile(profile: DriverProfileRequest): string | null {
  const { fullName, phone, licenseNumber, plateNumber, districtId } = profile;
  if (
    !fullName.trim() ||
    !phone.trim() ||
    !licenseNumber.trim() ||
    !plateNumber.trim() ||
    !districtId.trim()
  ) {
    return "Complete all required fields.";
  }
  if (!isValidPhone(phone.trim())) return "Enter a mobile number with 10 to 13 digits.";
  if (!isValidPlate(plateNumber.trim())) {
    return "Vehicle registration number must be 4 to 15 characters.";
  }
  return null;
}

/** Fares of paid trips, grouped by when the trip was paid. */
export function earningsByPeriod(
  trips: Pick<Booking, "fare" | "paidAt" | "createdAt">[],
  now = new Date(),
) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const since = (start: number) =>
    sumFares(trips.filter((trip) => Date.parse(trip.paidAt ?? trip.createdAt) >= start));

  return {
    today: since(startOfToday),
    last7Days: since(startOfWeek),
    thisMonth: since(startOfMonth),
  };
}

export function formatTripDate(booking: Pick<Booking, "scheduledAt" | "createdAt">): string {
  const date = new Date(booking.scheduledAt ?? booking.createdAt);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} • ${time}`;
}
