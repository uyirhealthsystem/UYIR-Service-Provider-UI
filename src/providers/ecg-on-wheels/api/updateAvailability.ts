import { ecgApi } from "./client";

export async function updateAvailability(providerId: string, isAvailableForBooking: boolean) {
  return ecgApi(`/provider/${providerId}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ isAvailableForBooking }),
  });
}
