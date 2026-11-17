const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HEALTH_PARTNER_API_URL || "http://13.235.76.15:3000",
);
