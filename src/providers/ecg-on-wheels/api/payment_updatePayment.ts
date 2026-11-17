import { ecgApi } from "./client";

export async function updatePayment(bookingId: string, payload: Record<string, unknown>) {
  return ecgApi(`/booking/${bookingId}/payment`, { method: "PUT", body: JSON.stringify(payload) });
}
