const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const DOCTOR_API_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HOSPITAL_API_URL || "http://13.201.204.85:8078",
);
