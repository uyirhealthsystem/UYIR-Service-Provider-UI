import { authFetch, getAccessToken } from "../../../auth/session";
import { BASE_URL } from "../config/env";

let laboratoryAccessToken: string | null = null;
let laboratoryProviderUserId: string | null = null;

/* =========================================================
   SET LABORATORY AUTH
========================================================= */

export function setLaboratoryAccessToken(
  token: string,
  providerUserId?: string,
) {
  laboratoryAccessToken = token;

  laboratoryProviderUserId = providerUserId || getJwtSubject(token);

  console.log("");
  console.log("==========================================");
  console.log("LAB CLIENT AUTH SET");
  console.log("==========================================");
  console.log("Access token available:", Boolean(token));
  console.log("Provider User ID:", laboratoryProviderUserId || "MISSING");
  console.log("==========================================");
}

/* =========================================================
   GET USER ID FROM JWT
========================================================= */

function getJwtSubject(token: string): string | null {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      console.log("LAB JWT ERROR: Invalid JWT format");

      return null;
    }

    const payload = parts[1];

    if (!payload || typeof globalThis.atob !== "function") {
      console.log("LAB JWT ERROR: Cannot decode JWT payload");

      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");

    const decoded = globalThis.atob(
      normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
    );

    const json = JSON.parse(decoded);

    console.log("");
    console.log("========== LAB JWT ==========");
    console.log("JWT sub:", json?.sub || "MISSING");
    console.log("JWT role:", json?.role || "MISSING");
    console.log("=============================");

    return typeof json?.sub === "string" ? json.sub : null;
  } catch (error) {
    console.log("LAB JWT DECODE ERROR:", error);

    return null;
  }
}

/* =========================================================
   GET AUTH VALUES
========================================================= */

export function getLaboratoryAccessToken() {
  // Prefer the shared session token: it is the one that gets refreshed.
  return getAccessToken() || laboratoryAccessToken;
}

export function getLaboratoryProviderUserId() {
  return laboratoryProviderUserId;
}

/* =========================================================
   LABORATORY API CLIENT
========================================================= */

export async function laboratoryApi(path: string, options: RequestInit = {}) {
  const token = getLaboratoryAccessToken();

  const userId = getLaboratoryProviderUserId();

  /*
    IMPORTANT

    Backend base path:

    /api/v1/labscan

    Therefore:

    laboratoryApi("/labs")
    ->
    /api/v1/labscan/labs

    laboratoryApi("/appointments/lab/:id")
    ->
    /api/v1/labscan/appointments/lab/:id
  */

  const url = `${BASE_URL}/api/v1/labscan${path}`;

  console.log("");
  console.log("==========================================");
  console.log("LAB API REQUEST");
  console.log("==========================================");
  console.log("Method:", options.method || "GET");
  console.log("URL:", url);
  console.log("x-user-id:", userId || "MISSING");
  console.log("Authorization:", token ? "Bearer token attached" : "MISSING");

  if (options.body) {
    console.log("Request body:", options.body);
  } else {
    console.log("Request body: NONE");
  }

  console.log("==========================================");

  try {
    const response = await authFetch(url, {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(userId
          ? {
              "x-user-id": userId,
            }
          : {}),

        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => null);

    console.log("");
    console.log("==========================================");
    console.log("LAB API RESPONSE");
    console.log("==========================================");
    console.log("URL:", url);
    console.log("Status:", response.status);
    console.log("OK:", response.ok);
    console.log("Response:", data);
    console.log("==========================================");

    if (!response.ok) {
      const error = new Error(
        data?.message ||
          data?.error?.message ||
          "Laboratory API request failed",
      );

      (error as any).status = response.status;

      (error as any).data = data;

      throw error;
    }

    return data;
  } catch (error) {
    console.log("");
    console.log("==========================================");
    console.log("LAB API ERROR");
    console.log("==========================================");
    console.log("URL:", url);
    console.log("Error:", error);
    console.log("==========================================");

    throw error;
  }
}
