import { ecgApi } from "./client";

export async function generateOTP(bookingId: string) {
  return ecgApi(`/booking/${bookingId}/otp`, { method: "POST" });
}
