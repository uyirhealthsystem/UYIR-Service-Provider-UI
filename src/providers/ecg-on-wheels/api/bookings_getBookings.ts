import { ecgApi } from "./client";

export async function getBookings() {
  return ecgApi("/bookings");
}
