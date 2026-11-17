import { proApi } from "./client";

export function getMyProfile(userId?: string) {
  return proApi("/pro/me", {
    headers: userId
      ? {
          "x-user-id": userId,
        }
      : undefined,
  });
}

export function getMyMetrics(userId?: string) {
  return proApi("/pro/me/metrics", {
    headers: userId
      ? {
          "x-user-id": userId,
        }
      : undefined,
  });
}

export function updateMyProfile(
  userId: string,
  data: {
    name?: string;
    photoUrl?: string;
    phone?: string;
    email?: string;
    districtId?: string;
    joiningDate?: string;
    status?: string;
  },
) {
  return proApi("/pro/me", {
    method: "PATCH",
    headers: {
      "x-user-id": userId,
    },
    body: JSON.stringify(data),
  });
}

export function getMyAbhaProfile(userId: string) {
  return proApi("/pro/me/abha", {
    headers: {
      "x-user-id": userId,
    },
  });
}

export function getMyHospitals(userId?: string) {
  return proApi("/pro/me/hospitals", {
    headers: userId ? { "x-user-id": userId } : undefined,
  });
}

export function getMyCheckpoints(userId?: string) {
  return proApi("/pro/me/hospitals/checkpoints", {
    headers: userId ? { "x-user-id": userId } : undefined,
  });
}
