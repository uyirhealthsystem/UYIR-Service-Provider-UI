import { ecgApi } from "./client";

export async function updateCapture(bookingId: string, payload: Record<string, unknown>) {
  return ecgApi(`/booking/${bookingId}/updatecapture`, { method: "PUT", body: JSON.stringify(payload) });
}
