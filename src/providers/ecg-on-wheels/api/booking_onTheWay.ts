import { ecgApi } from "./client";

export async function onTheWay(bookingId: string, providerId: string) {
  return ecgApi(`/booking/${bookingId}/on-the-way`, { method: "PATCH", body: JSON.stringify({ providerId }) });
}
