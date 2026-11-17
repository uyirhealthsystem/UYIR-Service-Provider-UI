import { ecgApi } from "./client";

export async function getProviderDashboard(providerId: string) {
  return ecgApi(`/provider/${providerId}/dashboard`);
}
