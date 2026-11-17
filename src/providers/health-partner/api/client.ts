import { authFetch, getAccessToken,
  getAuthRole,
  getAuthUserId,
} from "../../../auth/session";
import { BASE_URL } from "../config/env";

export async function healthPartnerApi(
  path: string,
  options: RequestInit = {},
) {
  const accessToken = getAccessToken();
  const userId = getAuthUserId();
  const role = getAuthRole();

  if (!accessToken) {
    throw new Error("Access token is missing. Please login again.");
  }

  if (!userId) {
    throw new Error("User ID is missing. Please login again.");
  }

  const response = await authFetch(`${BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "x-user-id": userId,
      "x-user-role": role || "HP",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error?.message ||
        "Health Partner API request failed",
    );

    (error as any).status = response.status;
    (error as any).data = data;

    throw error;
  }

  return data;
}
