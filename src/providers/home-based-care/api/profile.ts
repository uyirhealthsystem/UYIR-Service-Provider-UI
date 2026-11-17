import { hbcApi } from "./client";
import type { Provider, ProviderProfileInput, ProviderProfilePatch } from "./types";

// GET /provider/profile — 404 when the caller has not registered yet.
export function getMyProfile() {
  return hbcApi<Provider>("/provider/profile");
}

// POST /provider/profile — 201; 409 if already registered. No verification step.
export function registerProfile(input: ProviderProfileInput) {
  return hbcApi<Provider>("/provider/profile", { method: "POST", body: input });
}

// PATCH /provider/profile — careType is fixed; lat/lng must move together.
export function updateMyProfile(patch: ProviderProfilePatch) {
  return hbcApi<Provider>("/provider/profile", { method: "PATCH", body: patch });
}
