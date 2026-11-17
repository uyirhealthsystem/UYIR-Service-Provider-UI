const normalizeUrl = (value: string): string =>
  value.trim().replace(/\/+$/, "");

export const AUTH_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_AUTH_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://15.252.58.211",
);
