// The ambulance service's API contract (B:\uyir\ambulance: BookingDtos, DriverDtos).

export type BookingStatus =
  | "SCHEDULED"
  | "SEARCHING"
  | "EN_ROUTE_TO_PICKUP"
  | "ARRIVED"
  | "PICKED_UP"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_AMBULANCE_FOUND";

export type BookingType = "EMERGENCY" | "SCHEDULED";

export type EmergencyType =
  | "CARDIAC"
  | "ACCIDENT"
  | "BREATHING"
  | "STROKE"
  | "PREGNANCY"
  | "OTHER";

export type AmbulanceType = "TRANSPORT" | "BLS" | "ALS" | "ICU";

export type DriverStatus = "OFFLINE" | "AVAILABLE" | "BUSY";

export type ServiceType = "AMBULANCE" | "AUTO";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Place = {
  lat: number;
  lng: number;
  address: string | null;
};

export type Booking = {
  id: string;
  type: BookingType;
  status: BookingStatus;
  emergencyType: EmergencyType | null;
  ambulanceType: AmbulanceType | null;
  pickup: Place;
  drop: Place | null;
  scheduledAt: string | null;
  fare: number | null;
  driverId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  paymentId: string | null;
  paidAt: string | null;
  createdAt: string;
};

/** The server hides patient contact details until the driver accepts. */
export type Offer = {
  bookingId: string;
  type: BookingType;
  emergencyType: EmergencyType | null;
  pickup: Place;
  distanceKm: number | null;
  expiresAt: string;
};

export type TripHistoryPage = {
  page: number;
  size: number;
  totalBookings: number;
  bookings: Booking[];
};

export type DriverProfile = {
  userId: string;
  fullName: string;
  phone: string | null;
  licenseNumber: string;
  plateNumber: string;
  ambulanceType: AmbulanceType;
  districtId: string;
  status: DriverStatus;
};

export type DriverProfileRequest = {
  fullName: string;
  phone: string;
  licenseNumber: string;
  plateNumber: string;
  ambulanceType: AmbulanceType;
  districtId: string;
};

export type Technician = {
  id: string;
  fullName: string;
  phone: string;
  qualification: string | null;
  certificationNumber: string | null;
  createdAt: string;
};

export type TechnicianRequest = {
  fullName: string;
  phone: string;
  qualification?: string;
  certificationNumber?: string;
};

export type DriverStatusRequest = {
  online: boolean;
  lat?: number;
  lng?: number;
};

export type DriverLocationRequest = {
  lat: number;
  lng: number;
  heading?: number;
};
