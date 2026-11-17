const trimTrailingSlash = (value: string): string => value.trim().replace(/\/+$/, "");

export const TELECONSULTATION_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_TELECONSULTATION_API_URL ||
    "http://13.203.67.193:8082/api/v1",
);
