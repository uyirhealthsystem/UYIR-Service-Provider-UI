import { AUTH_BASE_URL } from "../config/env";

let accessToken = "";
let refreshToken = "";
let userId = "";
let role = "";

type TokenListener = (tokens: { accessToken: string; refreshToken: string }) => void;
type ExpiredListener = () => void;
type LogoutListener = () => void;

const tokenListeners = new Set<TokenListener>();
const expiredListeners = new Set<ExpiredListener>();
const logoutListeners = new Set<LogoutListener>();

export function setAuthSession(data: {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  role?: string;
}) {
  accessToken = data.accessToken || "";
  refreshToken = data.refreshToken || "";
  userId = data.userId || "";
  role = data.role || "";
}

export function clearAuthSession() {
  accessToken = "";
  refreshToken = "";
  userId = "";
  role = "";
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function getAuthUserId() {
  return userId;
}

export function getAuthRole() {
  return role;
}

/** Called with the new tokens after every successful refresh. Returns an unsubscribe function. */
export function onTokensRefreshed(listener: TokenListener) {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

/** Called when the session can't be refreshed and the user must log in again. */
export function onSessionExpired(listener: ExpiredListener) {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

/** Called when the user logs out, while the access token still works. Returns an unsubscribe function. */
export function onLogout(listener: LogoutListener) {
  logoutListeners.add(listener);
  return () => {
    logoutListeners.delete(listener);
  };
}

export function notifyLogout() {
  logoutListeners.forEach((l) => l());
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please log in again.");
  }
}

let inFlight: Promise<string> | null = null;

/**
 * Swaps the refresh token for a new access token (POST /auth/token/refresh).
 * The auth service rotates refresh tokens, so the old one stops working once used:
 * concurrent callers share one request instead of each spending the token.
 * Throws SessionExpiredError (and notifies onSessionExpired) when refresh is impossible.
 */
export function refreshAccessToken(): Promise<string> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const presented = refreshToken;
    if (!presented) throw expire();

    let response: Response;
    try {
      response = await fetch(`${AUTH_BASE_URL}/auth/token/refresh`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: presented }),
      });
    } catch (e) {
      // Network failure: keep the session so the user can retry once back online.
      throw e;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.accessToken) {
      console.log("Token refresh failed:", response.status, JSON.stringify(data));
      throw expire();
    }

    accessToken = data.accessToken;
    if (data.refreshToken) refreshToken = data.refreshToken;
    tokenListeners.forEach((l) => l({ accessToken, refreshToken }));
    return accessToken;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Ends this device's session on the auth service (POST /auth/logout). Best effort: never throws. */
export async function revokeSession(token = refreshToken) {
  if (!token) return;
  try {
    await fetch(`${AUTH_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    });
  } catch (e) {
    console.log("Logout request failed:", e);
  }
}

/** True when the access token is missing or expires within `skewSeconds`. */
export function isAccessTokenExpired(skewSeconds = 30) {
  if (!accessToken) return true;
  try {
    const part = accessToken.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const exp = JSON.parse(globalThis.atob(padded))?.exp;
    return typeof exp === "number" ? exp * 1000 - skewSeconds * 1000 < Date.now() : false;
  } catch {
    return false;
  }
}

function findAuthHeader(headers: RequestInit["headers"]): string | undefined {
  if (!headers) return undefined;
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.has("Authorization") ? "Authorization" : undefined;
  }
  if (Array.isArray(headers)) return undefined;
  return Object.keys(headers).find((k) => k.toLowerCase() === "authorization");
}

function withToken(headers: RequestInit["headers"], key: string, token: string): RequestInit["headers"] {
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const copy = new Headers(headers);
    copy.set("Authorization", `Bearer ${token}`);
    return copy;
  }
  return { ...(headers as Record<string, string>), [key]: `Bearer ${token}` };
}

/**
 * fetch() for requests that send `Authorization: Bearer <access token>`.
 * On a 401 it refreshes the access token once and retries with the new one.
 * Requests without an Authorization header behave exactly like fetch().
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(input, init);
  const key = findAuthHeader(init.headers);
  if (response.status !== 401 || !key || !refreshToken) return response;

  const token = await refreshAccessToken();
  return fetch(input, { ...init, headers: withToken(init.headers, key, token) });
}

function expire() {
  clearAuthSession();
  expiredListeners.forEach((l) => l());
  return new SessionExpiredError();
}
