import { authFetch, getAccessToken } from "../../../auth/session";
import { API_PREFIX, BASE_URL } from "../config/env";

let proUserId = "";

/** Full URL for a PRO route, e.g. proUrl("/pro/abha/otp"). Works direct or via the gateway (see API_PREFIX). */
export function proUrl(path: string) {
  return `${BASE_URL}${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The gateway requires the access token on every PRO call (and replaces
 * x-user-id with the token's user). The PRO service itself ignores it, so
 * direct calls keep working. With the header present, authFetch also
 * refreshes an expired token and retries once.
 */
export function proAuthHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function setProUserId(userId: string | null | undefined) {
  proUserId = userId || "";
}

export function getProUserId() {
  return proUserId;
}

export async function proApi(path: string, options: RequestInit = {}) {
  const response = await authFetch(proUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...proAuthHeader(),
      ...(proUserId ? { "x-user-id": proUserId } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error?.message || "PRO API request failed",
    );

    (error as any).status = response.status;
    (error as any).data = data;

    throw error;
  }

  return data;
}
