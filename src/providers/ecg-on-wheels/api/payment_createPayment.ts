import { ecgApi } from "./client";

export async function createPayment(bookingId: string, payload: Record<string, unknown>) {
  return ecgApi(`/booking/${bookingId}/payment`, { method: "POST", body: JSON.stringify(payload) });
}
