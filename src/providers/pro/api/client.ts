import { BASE_URL } from "../config/env";

let proUserId = "";

export function setProUserId(userId: string | null | undefined) {
  proUserId = userId || "";
}

export function getProUserId() {
  return proUserId;
}

export async function proApi(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(proUserId ? { "x-user-id": proUserId } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error?.message || "PRO API request failed",
    );

    (error as any).status = response.status;
    (error as any).data = data;

    throw error;
  }

  return data;
}
