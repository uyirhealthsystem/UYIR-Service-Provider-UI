const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_PRO_API_URL || "http://3.6.236.124",
);

export const HOSPITAL_API_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HOSPITAL_API_URL || "http://13.201.204.85:8078",
);
