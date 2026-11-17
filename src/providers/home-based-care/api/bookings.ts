import { hbcApi } from "./client";
import type { Booking, BookingStatus } from "./types";

const path = (id: string, action = "") =>
  `/provider/bookings/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;

// Open bookings matched by care type + pincode/radius, nearest first.
// 403 PROVIDER_PROFILE_REQUIRED / PROVIDER_LOCATION_REQUIRED.
export function getPool() {
  return hbcApi<Booking[]>("/provider/bookings/pool");
}

// Bookings assigned to me, optionally filtered by status.
export function getMyBookings(status?: BookingStatus) {
  return hbcApi<Booking[]>(`/provider/bookings${status ? `?status=${status}` : ""}`);
}

// Assigned booking with patient contact + prescriptions (never the OTP).
export function getBooking(id: string) {
  return hbcApi<Booking>(path(id));
}

// PENDING → ACCEPTED. 409 BOOKING_UNAVAILABLE if someone else took it, 404 if out of range.
export function acceptBooking(id: string) {
  return hbcApi<Booking>(path(id, "accept"), { method: "POST" });
}

// ACCEPTED → PENDING (e.g. patient unreachable).
export function releaseBooking(id: string, reason?: string) {
  return hbcApi<Booking>(path(id, "release"), { method: "POST", body: reason ? { reason } : {} });
}

// ACCEPTED → CONFIRMED after calling the patient.
export function confirmBooking(id: string, note?: string) {
  return hbcApi<Booking>(path(id, "confirm"), { method: "POST", body: note ? { note } : {} });
}

// PAID → IN_PROGRESS with the patient's 6-digit visit OTP. 429 after too many attempts.
export function startBooking(id: string, otp: string) {
  return hbcApi<Booking>(path(id, "start"), { method: "POST", body: { otp } });
}

// IN_PROGRESS → COMPLETED.
export function completeBooking(id: string, note?: string) {
  return hbcApi<Booking>(path(id, "complete"), { method: "POST", body: note ? { note } : {} });
}
