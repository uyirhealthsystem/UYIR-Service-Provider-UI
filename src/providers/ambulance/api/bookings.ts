import { ambulanceApi } from "./client";

export function getOpenOffers() {
  return ambulanceApi("/driver/bookings/offers");
}

export function getCurrentBooking() {
  return ambulanceApi("/driver/bookings/current");
}

export function getMyBookings() {
  return ambulanceApi("/bookings");
}

export function getBooking(bookingId: string) {
  return ambulanceApi(`/bookings/${bookingId}`);
}

export function acceptBooking(bookingId: string) {
  return ambulanceApi(`/driver/bookings/${bookingId}/accept`, {
    method: "POST",
  });
}

export function rejectBooking(bookingId: string) {
  return ambulanceApi(`/driver/bookings/${bookingId}/reject`, {
    method: "POST",
  });
}

export function arrivedAtPickup(bookingId: string) {
  return ambulanceApi(`/driver/bookings/${bookingId}/arrived`, {
    method: "POST",
  });
}

export function pickupPatient(bookingId: string, otp: string) {
  return ambulanceApi(`/driver/bookings/${bookingId}/pickup`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export function dropPatient(bookingId: string) {
  return ambulanceApi(`/driver/bookings/${bookingId}/drop`, {
    method: "POST",
  });
}
