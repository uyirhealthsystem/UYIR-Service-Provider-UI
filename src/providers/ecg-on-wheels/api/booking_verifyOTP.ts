import { ecgApi } from "./client";

export async function verifyOTP(bookingId: string, otp: string) {
  return ecgApi(`/booking/${bookingId}/otp/verify`, { method: "POST", body: JSON.stringify({ otp }) });
}
