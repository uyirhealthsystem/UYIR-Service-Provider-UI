import { HOSPITAL_BASE_URL } from "../config/env";
import { authFetch, getAccessToken, getAuthUserId, getAuthRole } from "../../../auth/session";
import { getUserIdFromAccessToken } from "../../../auth/token";

export function getHospitalAuthContext() {
  const token = getAccessToken();
  // The Hospital Service collection specifies that X-User-Id is the AuthService user ID.
  // The JWT sub is that ID; do not send the hospital record ID in this header.
  const userId = (token ? getUserIdFromAccessToken(token) : "") || getAuthUserId();
  return { token, userId, role: getAuthRole() || "HOSPITAL" };
}

export async function hospitalApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const { token, userId, role } = getHospitalAuthContext();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body && typeof options.body === "string" ? { "Content-Type": "application/json" } : {}),
    ...(userId ? { "X-User-Id": userId } : {}),
    "X-User-Role": role.toUpperCase().includes("HOSPITAL") ? "HOSPITAL" : role.toUpperCase(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  if (!userId) throw new Error("Hospital account ID is missing. Please log in again.");
  const response = await authFetch(`${HOSPITAL_BASE_URL}/api/v1/hospital${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Validation errors carry field-level reasons in `details` (ApiError shape) — surface them.
    const details = Array.isArray(data?.details) && data.details.length ? `\n• ${data.details.join("\n• ")}` : "";
    const error = new Error((data?.message || data?.error?.message || `Hospital API failed (${response.status})`) + details);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }
  return data as T;
}
