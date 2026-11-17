import { ecgApi, unwrapList, unwrapObject } from "./client";

export async function getAllBookings() {
  return ecgApi("/bookings");
}

export async function getBooking(bookingId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}`));
}

export async function acceptBooking(bookingId: string, providerId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/accept`, {
    method: "PATCH",
    body: JSON.stringify({ providerId }),
  }));
}

export async function rejectBooking(bookingId: string, providerId: string, reason = "Provider unavailable") {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ providerId, reason }),
  }));
}

export async function onTheWay(bookingId: string, providerId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/on-the-way`, {
    method: "PATCH",
    body: JSON.stringify({ providerId }),
  }));
}

export async function reached(bookingId: string, providerId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/reached`, {
    method: "PATCH",
    body: JSON.stringify({ providerId }),
  }));
}

export async function startBooking(bookingId: string, providerId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/start`, {
    method: "PATCH",
    body: JSON.stringify({ providerId }),
  }));
}

export async function completeBooking(bookingId: string, providerId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ providerId }),
  }));
}

export function listFromResponse(data: any) {
  return unwrapList(data);
}
