import { getUserIdFromAccessToken } from "../../../auth/token";
import { authFetch, getAccessToken } from "../../../auth/session";
import { BASE_URL } from "../config/env";

export function getAmbulanceAuth() {
  const accessToken = getAccessToken();
  const userId = accessToken ? getUserIdFromAccessToken(accessToken) : "";

  if (!accessToken) {
    throw new Error("Access token is missing. Please login again.");
  }

  if (!userId) {
    throw new Error("User ID (sub) is missing from access token.");
  }

  return { userId };
}

export async function ambulanceApi(
  path: string,
  options: RequestInit = {},
) {
  const { userId } = getAmbulanceAuth();
  const url = `${BASE_URL}/api/v1/ambulance${path}`;

  console.log("AMBULANCE API:", options.method || "GET", url);
  console.log("AMBULANCE USER ID (JWT sub):", userId);

  const response = await authFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-user-role": "AMBULANCE_DRIVER",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  console.log("AMBULANCE API STATUS:", response.status);
  console.log("AMBULANCE API RESPONSE:", data);

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error?.message || "Ambulance API request failed",
    );

    (error as any).status = response.status;
    (error as any).data = data;

    throw error;
  }

  return data;
}
