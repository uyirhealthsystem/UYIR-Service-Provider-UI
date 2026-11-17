import { ecgApi } from "./client";

export async function createCapture(bookingId: string, payload: Record<string, unknown>) {
  return ecgApi(`/booking/${bookingId}/capture`, { method: "POST", body: JSON.stringify(payload) });
}
