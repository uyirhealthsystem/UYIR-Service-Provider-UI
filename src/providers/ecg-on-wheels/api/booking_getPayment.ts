import { ecgApi } from "./client";

export async function getPayment(bookingId: string) {
  return ecgApi(`/booking/${bookingId}/payment`);
}
