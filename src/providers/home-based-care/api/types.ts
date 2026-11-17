// Shapes from the Home Based Care API (Postman collection + openapi.yaml).
// Patient-only endpoints are intentionally not modelled here.

export type CareType = "NURSE" | "PHYSIO" | "CARETAKER";

export const CARE_TYPES: CareType[] = ["NURSE", "PHYSIO", "CARETAKER"];

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONFIRMED"
  | "PAID"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type Provider = {
  id: string;
  fullName: string;
  phone: string;
  careType: CareType;
  licenseNo?: string | null;
  experienceYears?: number | null;
  city?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string;
};

export type ProviderProfileInput = {
  careType: CareType;
  serviceIds: string[];
  fullName: string;
  phone: string;
  pincode: string;
  latitude: number;
  longitude: number;
  licenseNo?: string;
  experienceYears?: number;
  city?: string;
};

// careType cannot be changed; latitude and longitude must be sent together.
export type ProviderProfilePatch = Partial<Omit<ProviderProfileInput, "careType">>;

export type CareService = {
  id: string;
  careType: CareType;
  name: string;
  description?: string | null;
  price: number;
  durationMinutes: number;
  isActive?: boolean;
};

export type Prescription = {
  id?: string;
  medicineName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  documentUrl?: string | null;
};

export type ContactInfo = { id?: string; fullName?: string; phone?: string };

// Role-filtered: in the pool, patient/address/coords/notes/prescriptions are
// omitted and distanceKm is added. visitOtp is never returned to providers.
export type Booking = {
  id: string;
  status: BookingStatus;
  careType: CareType;
  service?: { id: string; name: string; durationMinutes?: number };
  amount?: number;
  scheduledAt?: string;
  address?: string;
  city?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  notes?: string | null;
  patient?: ContactInfo;
  provider?: ContactInfo;
  prescriptions?: Prescription[];
  acceptedAt?: string | null;
  confirmedAt?: string | null;
  paidAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt?: string;
};

export const ACTIVE_STATUSES: BookingStatus[] = ["ACCEPTED", "CONFIRMED", "PAID", "IN_PROGRESS"];
