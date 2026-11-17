const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_LAB_SCAN_API_URL || "http://13.233.101.200:8082",
);
export const LAB_REGISTRATION_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_LAB_REGISTRATION_API_URL || "http://13.233.101.200:8082",
);
