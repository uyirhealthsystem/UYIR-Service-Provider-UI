import { ecgApi } from "./client";

export async function acceptBooking(bookingId: string, providerId: string) {
  return ecgApi(`/booking/${bookingId}/accept`, { method: "PATCH", body: JSON.stringify({ providerId }) });
}
