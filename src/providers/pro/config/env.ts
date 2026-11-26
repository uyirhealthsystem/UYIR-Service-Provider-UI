const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_PRO_API_URL || "http://3.6.236.124",
);

export const HOSPITAL_API_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HOSPITAL_API_URL || "http://13.201.204.85:8078",
);

/**
 * Path prefix in front of PRO's routes (/pro/..., /pros, /prolabs, ...).
 *  - "/api/v1"      -> calling the PRO service directly (default)
 *  - "/api/v1/pro"  -> calling through the API gateway (EXPO_PUBLIC_PRO_API_URL = gateway URL)
 */
export const API_PREFIX = normalizeUrl(process.env.EXPO_PUBLIC_PRO_API_PREFIX || "/api/v1");
