import { ecgApi } from "./client";

export async function reached(bookingId: string, providerId: string) {
  return ecgApi(`/booking/${bookingId}/reached`, { method: "PATCH", body: JSON.stringify({ providerId }) });
}
