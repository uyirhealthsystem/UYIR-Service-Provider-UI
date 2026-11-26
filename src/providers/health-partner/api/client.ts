import { authFetch, getAccessToken,
  getAuthRole,
  getAuthUserId,
} from "../../../auth/session";
import { API_PREFIX, BASE_URL } from "../config/env";

export type HealthPartnerApiError = Error & { status?: number; data?: any };

/**
 * The HP service answers validation failures with `{ message }` where message
 * is a ZodError's JSON (`[{"path":["phone"],"message":"Invalid phone number"}]`).
 * Turn that into one readable sentence.
 */
export function readableMessage(raw: unknown, fallback: string): string {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return fallback;
  if (text.startsWith("[")) {
    try {
      const issues = JSON.parse(text);
      if (Array.isArray(issues) && issues.length) {
        const first = issues[0];
        const field = Array.isArray(first?.path) ? first.path.join(".") : "";
        const message = String(first?.message || "").trim();
        if (message && field && !message.toLowerCase().includes(field.toLowerCase())) {
          return `${field}: ${message}`;
        }
        return message || fallback;
      }
    } catch {
      // not JSON after all - fall through and show it as-is
    }
  }
  return text;
}

export async function healthPartnerApi(
  path: string,
  options: RequestInit = {},
) {
  const accessToken = getAccessToken();
  const userId = getAuthUserId();
  const role = getAuthRole();

  if (!accessToken || !userId) {
    throw new Error("Your session has expired. Please log in again.");
  }

  let response: Response;
  try {
    response = await authFetch(`${BASE_URL}${API_PREFIX}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "x-user-id": userId,
        "x-user-role": role || "HP",
        ...(options.headers || {}),
      },
    });
  } catch (networkError) {
    console.log("HP network error:", networkError);
    throw new Error("Can't reach the server. Check your internet connection and try again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      readableMessage(
        data?.message || data?.error?.message,
        "Something went wrong. Please try again.",
      ),
    ) as HealthPartnerApiError;

    error.status = response.status;
    // Raw body kept: auth/service.ts reads data.message to spot "not found".
    error.data = data;

    throw error;
  }

  return data;
}
