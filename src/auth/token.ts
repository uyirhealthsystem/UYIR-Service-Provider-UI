export function decodeAccessToken(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    const decoded = globalThis.atob(padded);

    return JSON.parse(decoded);
  } catch (error) {
    console.log("Unable to decode access token:", error);
    return null;
  }
}

export function getUserIdFromAccessToken(token: string) {
  const payload = decodeAccessToken(token);
  return payload?.sub || payload?.userId || payload?.id || "";
}
