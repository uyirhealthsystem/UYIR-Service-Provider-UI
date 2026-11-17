import { getAccessToken as getToken, getAuthRole as getRole, getAuthUserId as getUserId } from "../../../auth/session";

export { getToken as getAccessToken, getRole as getAuthRole, getUserId as getAuthUserId };

export function getSubFromAccessToken(token: string): string {
  try {
    const part = token.split(".")[1];
    if (!part) return "";
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    const payload = JSON.parse(globalThis.atob(padded));
    return String(payload?.sub || "");
  } catch {
    return "";
  }
}
