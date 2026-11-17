const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const HOSPITAL_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HOSPITAL_API_URL || "http://13.201.204.85:8078",
);

const toWebSocketUrl = (httpUrl: string): string => httpUrl.replace(/^http/i, "ws");

/**
 * Live booking updates (WebSocket).
 * Production: set EXPO_PUBLIC_HOSPITAL_WS_URL=wss://<gateway-host>/api/v1/hospital/ws
 * Default: same host as the REST base URL (works for local dev / direct service calls).
 */
export const HOSPITAL_WS_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HOSPITAL_WS_URL ||
    `${toWebSocketUrl(HOSPITAL_BASE_URL)}/api/v1/hospital/ws`,
);
