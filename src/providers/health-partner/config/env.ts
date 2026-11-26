const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_HEALTH_PARTNER_API_URL || "http://13.235.76.15:3000",
);

/**
 * Path prefix in front of Health Partner's routes (/profile, /referrals, /payments, ...).
 *  - "/api/v1"     -> calling the HP service directly (default)
 *  - "/api/v1/hp"  -> calling through the API gateway (EXPO_PUBLIC_HEALTH_PARTNER_API_URL = gateway URL)
 */
export const API_PREFIX = normalizeUrl(process.env.EXPO_PUBLIC_HEALTH_PARTNER_API_PREFIX || "/api/v1");
