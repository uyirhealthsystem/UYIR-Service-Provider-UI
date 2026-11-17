import { ecgApi } from "./client";

export async function completeBooking(bookingId: string, providerId: string) {
  return ecgApi(`/booking/${bookingId}/complete`, { method: "PATCH", body: JSON.stringify({ providerId }) });
}
