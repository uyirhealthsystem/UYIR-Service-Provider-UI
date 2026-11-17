import { proApi } from "./client";

export function getMyMetrics(userId: string) {
  return proApi("/pro/me/metrics", {
    headers: {
      "x-user-id": userId,
    },
  });
}

export function getMyCheckpoints(userId: string) {
  return proApi("/pro/me/hospitals/checkpoints", {
    headers: {
      "x-user-id": userId,
    },
  });
}
