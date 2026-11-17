import { ecgApi } from "./client";

export async function getReport(bookingId: string) {
  return ecgApi(`/booking/${bookingId}/report`);
}
