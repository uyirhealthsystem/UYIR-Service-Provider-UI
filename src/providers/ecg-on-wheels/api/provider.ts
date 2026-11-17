import { ecgApi, unwrapList, unwrapObject } from "./client";

export async function getProviders() {
  return ecgApi("/providers");
}

export async function getMyECGProvider(userId: string) {
  // The backend resolves the provider from the JWT subject passed as x-user-id.
  const response = await ecgApi("/provider/me", {
    headers: { "x-user-id": userId },
  });
  return unwrapObject(response);
}

export async function getProvider(providerId: string) {
  return ecgApi(`/provider/${providerId}`);
}

export async function createProvider(payload: any) {
  return ecgApi("/provider", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProvider(providerId: string, payload: any) {
  return ecgApi(`/provider/${providerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateAvailability(providerId: string, isAvailableForBooking: boolean) {
  return ecgApi(`/provider/${providerId}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ isAvailableForBooking }),
  });
}

export async function updateProviderStatus(providerId: string, status: string) {
  return ecgApi(`/provider/${providerId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getProviderDashboard(providerId: string) {
  return unwrapObject(await ecgApi(`/provider/${providerId}/dashboard`));
}

export async function getProviderDocuments(providerId: string) {
  return ecgApi(`/provider/${providerId}/documents`);
}

export async function getProviderBank(providerId: string) {
  return ecgApi(`/provider/${providerId}/bank`);
}

export async function updateProviderLocation(providerId: string, latitude: number, longitude: number) {
  return ecgApi(`/provider/${providerId}/location`, {
    method: "PUT",
    body: JSON.stringify({ latitude, longitude }),
  });
}
