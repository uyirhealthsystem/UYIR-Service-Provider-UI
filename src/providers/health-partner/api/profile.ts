import { healthPartnerApi } from "./client";

// GET /api/v1/profile is the self-profile endpoint in the supplied HP collection.
export function getProfile() {
  return healthPartnerApi("/profile");
}

export function updateProfile(data: Record<string, unknown>) {
  return healthPartnerApi("/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
