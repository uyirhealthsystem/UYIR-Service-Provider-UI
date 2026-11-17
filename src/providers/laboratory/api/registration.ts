import { authFetch, getAccessToken,
  getAuthRole,
  getAuthUserId,
} from "../../../auth/session";
import { LAB_REGISTRATION_BASE_URL } from "../config/env";
const BASE_URL = LAB_REGISTRATION_BASE_URL;
async function postRegistration(path: string, payload: Record<string, any>) {
  const token = getAccessToken();
  const userId = getAuthUserId();
  if (!token || !userId)
    throw new Error("Please login again before registering your lab.");
  const response = await authFetch(`${BASE_URL}/api/v1/labscan${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": userId,
      "x-user-role": getAuthRole() || "LS",
    },
    body: JSON.stringify(
      path === "/scancenter"
        ? { ...payload, scanCenterUserId: userId }
        : payload,
    ),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message || data?.error?.message || "Registration request failed.",
    );
  return data;
}
export function createLabRegistration(payload: Record<string, any>) {
  return postRegistration("/lab", payload);
}
export function createScanCenterRegistration(payload: Record<string, any>) {
  return postRegistration("/scancenter", payload);
}
