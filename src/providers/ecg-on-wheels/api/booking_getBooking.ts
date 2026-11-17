import { ecgApi } from "./client";

export async function getBooking(bookingId: string) {
  return ecgApi(`/booking/${bookingId}`);
}
