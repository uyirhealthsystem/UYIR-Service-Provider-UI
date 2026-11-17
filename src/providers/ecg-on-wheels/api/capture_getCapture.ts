import { ecgApi } from "./client";

export async function getCapture(bookingId: string) {
  return ecgApi(`/booking/${bookingId}/capture`);
}
