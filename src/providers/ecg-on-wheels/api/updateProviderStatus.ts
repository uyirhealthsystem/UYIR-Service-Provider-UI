import { ecgApi } from "./client";

export async function updateProviderStatus(providerId: string, status: string) {
  return ecgApi(`/provider/${providerId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
