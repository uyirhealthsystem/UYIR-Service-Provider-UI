import { authFetch, getAccessToken, getAuthUserId, getAuthRole } from "../../../auth/session";
import { LAB_API_BASE_URL } from "../config/env";

export type CollectorRegistrationPayload = { labId: string; name: string; phone: string; status: "ACTIVE" | "INACTIVE" };

export async function createCollectorProfile(payload: CollectorRegistrationPayload) {
  const token = getAccessToken();
  const userId = getAuthUserId();
  if (!token || !userId) throw new Error("Please login again before registering as a collector.");
  const response = await authFetch(`${LAB_API_BASE_URL}/api/v1/collector`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-user-id": userId, "x-user-role": getAuthRole() || "LSC" },
    body: JSON.stringify(payload),
  });
  const data: any = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error?.message || "Unable to register sample collector.");
  return data;
}
