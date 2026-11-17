import { ecgApi } from "./client";

export async function rejectBooking(bookingId: string, providerId: string, reason: string) {
  return ecgApi(`/booking/${bookingId}/reject`, { method: "PATCH", body: JSON.stringify({ providerId, reason }) });
}
