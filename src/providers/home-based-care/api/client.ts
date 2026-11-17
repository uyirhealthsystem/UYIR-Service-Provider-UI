import { authFetch, getAccessToken, getAuthUserId } from "../../../auth/session";
import { getUserIdFromAccessToken } from "../../../auth/token";
import { BASE_URL, GATEWAY_SHARED_SECRET } from "../config/env";

// The API gateway validates the Bearer token and forwards X-User-Id + X-Role.
// We also send both headers ourselves so direct (non-gateway) dev servers work.
// Every care provider is X-Role HBC; NURSE / PHYSIO / CARETAKER are not roles.
const ROLE = "HBC";

let hbcUserId = "";

export function setHbcUserId(userId: string | null | undefined) {
  hbcUserId = userId || "";
}

export class HbcApiError extends Error {
  status: number;
  code: string;
  data: any;
  constructor(message: string, status: number, code: string, data: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function resolveIdentity() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Access token is missing. Please log in again.");
  const userId = hbcUserId || getAuthUserId() || getUserIdFromAccessToken(accessToken);
  if (!userId) throw new Error("User ID (JWT sub) is missing from the access token.");
  return { accessToken, userId };
}

type Options = { method?: string; body?: unknown; auth?: boolean };

export async function hbcApi<T = any>(path: string, { method = "GET", body, auth = true }: Options = {}): Promise<T> {
  const url = `${BASE_URL}/api/v1/hbc${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (GATEWAY_SHARED_SECRET) headers["x-gateway-secret"] = GATEWAY_SHARED_SECRET;

  if (auth) {
    const { accessToken, userId } = resolveIdentity();
    headers.Authorization = `Bearer ${accessToken}`;
    headers["X-User-Id"] = userId;
    headers["X-Role"] = ROLE;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // authFetch refreshes an expired token and retries once.
  const response = await authFetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    // Error shape: { error: { code, message, details } }
    const code = data?.error?.code || "";
    const message = data?.error?.message || data?.message || `Request failed (${response.status})`;
    throw new HbcApiError(message, response.status, code, data);
  }
  return data as T;
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  return error instanceof Error && error.message ? error.message : fallback;
}
