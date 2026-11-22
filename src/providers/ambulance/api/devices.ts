import { ambulanceApi } from "./client";

/** Safe to repeat: call after login and whenever FCM issues a new token. */
export function registerDevice(token: string) {
  return ambulanceApi<void>("/driver/devices", {
    method: "POST",
    body: JSON.stringify({ token, platform: "ANDROID" }),
  });
}

/** Safe to repeat: call on logout, while the access token is still available. */
export function unregisterDevice(token: string) {
  return ambulanceApi<void>(`/driver/devices?token=${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}
