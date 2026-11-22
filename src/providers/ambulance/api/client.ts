import { authFetch, getAccessToken } from "../../../auth/session";
import { getUserIdFromAccessToken } from "../../../auth/token";
import { BASE_URL } from "../config/env";
import { ApiError } from "./errors";

const DRIVER_ROLE = "AMBULANCE_DRIVER";

function getDriverIdentity() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing. Please login again.");
  }

  const userId = getUserIdFromAccessToken(accessToken);
  if (!userId) {
    throw new Error("User ID (sub) is missing from access token.");
  }

  return { accessToken, userId };
}

export async function ambulanceApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken, userId } = getDriverIdentity();

  const response = await authFetch(`${BASE_URL}/api/v1/ambulance${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-User-Id": userId,
      "X-User-Role": DRIVER_ROLE,
      ...(options.headers || {}),
    },
  });

  // Empty on 204 responses and when the driver has no current trip.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}
