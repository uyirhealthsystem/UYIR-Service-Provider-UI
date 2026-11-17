const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const LAB_API_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_LAB_API_URL || "http://13.233.101.200:8082",
);
