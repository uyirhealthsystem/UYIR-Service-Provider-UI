import { authFetch, getAccessToken } from "../../../auth/session";
import { getUserIdFromAccessToken } from "../../../auth/token";

import { BASE_URL as ECG_BASE_URL } from "../config/env";

export function getECGAuth() {
  const accessToken = getAccessToken();
  const userId = accessToken ? getUserIdFromAccessToken(accessToken) : "";

  if (!accessToken) throw new Error("Access token is missing. Please login again.");
  if (!userId) throw new Error("User ID (JWT sub) is missing.");

  return { accessToken, userId };
}

export async function ecgApi(path: string, options: RequestInit = {}) {
  const { accessToken, userId } = getECGAuth();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${ECG_BASE_URL}/api/v1/ecg${normalizedPath}`;

  console.log("ECG API:", options.method || "GET", url);
  console.log("ECG JWT sub:", userId);

  const isMultipart = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    "x-user-id": userId,
    ...(options.headers as Record<string, string> || {}),
  };

  // Do not set Content-Type manually for FormData; fetch must add the multipart boundary.
  if (!isMultipart && options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await authFetch(url, { ...options, headers });

  const data = await response.json().catch(() => null);
  console.log("ECG API STATUS:", response.status);
  console.log("ECG API RESPONSE:", data);

  if (!response.ok) {
    const error = new Error(data?.message || data?.error?.message || "ECG API request failed");
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data;
}

export function unwrapList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.providers)) return data.providers;
  if (Array.isArray(data?.bookings)) return data.bookings;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export function unwrapObject(data: any): any {
  return data?.data ?? data?.provider ?? data?.booking ?? data;
}
