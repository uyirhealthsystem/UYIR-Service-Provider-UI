import { ecgApi } from "./client";

export async function getProvider(providerId: string) {
  return ecgApi(`/provider/${providerId}`);
}
