const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_AMBULANCE_API_URL || "http://3.108.55.248",
);
export const GOOGLE_ROUTES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
