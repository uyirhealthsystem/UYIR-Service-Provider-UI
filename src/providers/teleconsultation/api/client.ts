import { authFetch } from "../../../auth/session";
import { getAccessToken, getAuthRole, getAuthUserId } from "./session";
import { TELECONSULTATION_BASE_URL } from "../config/env";

type ApiOptions = RequestInit & { userId?: string; userRole?: string };

export async function teleconsultationApi<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { userId, userRole, headers, ...requestOptions } = options;
  const token = getAccessToken();
  const resolvedUserId = userId || getAuthUserId();
  const resolvedRole = userRole || getAuthRole() || "DOCTOR";

  const response = await authFetch(`${getBaseUrl()}${path}`, {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(resolvedUserId ? { "x-user-id": resolvedUserId } : {}),
      "x-user-role": resolvedRole,
      ...(headers || {}),
    },
  });

  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    const error: any = new Error(
      data?.message || data?.error?.message || `Request failed (${response.status})`,
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as T;
}

function getBaseUrl() {
  return TELECONSULTATION_BASE_URL;
}
