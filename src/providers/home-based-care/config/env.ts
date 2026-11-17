const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HBC_API_URL || "http://15.252.164.86:4000",
);

// Sent as x-gateway-secret so the service accepts requests that bypass the gateway (local dev).
export const GATEWAY_SHARED_SECRET = (process.env.EXPO_PUBLIC_GATEWAY_SHARED_SECRET || "").trim();
