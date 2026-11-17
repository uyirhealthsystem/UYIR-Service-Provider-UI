import { ecgApi } from "./client";

export async function startBooking(bookingId: string, providerId: string) {
  return ecgApi(`/booking/${bookingId}/start`, { method: "PATCH", body: JSON.stringify({ providerId }) });
}
