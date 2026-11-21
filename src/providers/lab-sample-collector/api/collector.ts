import * as FileSystem from "expo-file-system/legacy";

import { authFetch, getAccessToken, getAuthRole, getAuthUserId, getRefreshToken, refreshAccessToken } from "../../../auth/session";
import { LAB_API_BASE_URL } from "../config/env";

export type CollectorProfile = {
  collectorId: string;
  userId?: string;
  collectorType: "LAB" | "INDEPENDENT";
  labId?: string | null;
  name: string;
  phone?: string;
  role?: "NURSE" | "TECHNICIAN";
  qualification?: string;
  qualificationNumber?: string;
  qualificationProofUrl?: string;
  qualificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  status: "ACTIVE" | "INACTIVE";
  latitude?: number | null;
  longitude?: number | null;
  lastLocationAt?: string | null;
  isAvailable?: boolean;
};

export type CollectorRegistrationPayload = {
  collectorType: "LAB" | "INDEPENDENT";
  labId?: string;
  name: string;
  phone: string;
  role: "TECHNICIAN";
  qualification?: string;
  qualificationNumber?: string;
  qualificationProofUrl?: string;
};

async function collectorRequest(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  const userId = getAuthUserId();
  const role = getAuthRole() || "LSC";
  const response = await authFetch(`${LAB_API_BASE_URL}/api/v1/labscan${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-user-id": userId,
      "x-user-role": role,
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || body?.error?.message || "LabScan request failed.") as Error & {
      status: number;
      data: unknown;
    };
    error.status = response.status;
    error.data = body;
    throw error;
  }
  return body?.data !== undefined ? body.data : body;
}

export function createCollectorProfile(payload: CollectorRegistrationPayload) {
  return collectorRequest("/collector", { method: "POST", body: JSON.stringify(payload) });
}

export function getMyCollectorProfile() {
  return collectorRequest("/collectors/me");
}

export function getMyCollectorDashboard() {
  return collectorRequest("/collectors/me/dashboard");
}

export function getMyCollectorHistory() {
  return collectorRequest("/collectors/me/history");
}

export function getMyCollectorEarnings() {
  return collectorRequest("/collectors/me/earnings");
}

export function getMyCollectorBookings() {
  return collectorRequest("/collectors/me/bookings");
}

export function getMyCollectorOffers() {
  return collectorRequest("/collectors/me/offers");
}

export function acceptCollectorOffer(offerId: string) {
  return collectorRequest(`/collectors/me/offers/${encodeURIComponent(offerId)}/accept`, { method: "POST", body: "{}" });
}

export function rejectCollectorOffer(offerId: string) {
  return collectorRequest(`/collectors/me/offers/${encodeURIComponent(offerId)}/reject`, { method: "POST", body: "{}" });
}

export function updateCollectorLocation(latitude: number, longitude: number, isAvailable = true) {
  return collectorRequest("/collectors/me/location", {
    method: "PATCH",
    body: JSON.stringify({ latitude, longitude, isAvailable }),
  });
}

export function updateCollectorProfile(
  payload: {
    name?: string;
    phone?: string;
    qualification?: string;
    qualificationNumber?: string;
    qualificationProofUrl?: string;
  },
) {
  return collectorRequest("/collectors/me/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getCollectorSamples() {
  return collectorRequest("/collector/samples");
}

export function verifyHomeCollectionOtp(homeCollectionId: string, otp: string) {
  return collectorRequest(`/collector/homecollection/${encodeURIComponent(homeCollectionId)}/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export function createSample(payload: {
  appointmentTestId: string;
  homeCollectionId: string;
  barcode: string;
  sampleType: string;
  containerType?: string;
  notes?: string;
}) {
  return collectorRequest("/sample", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCollectorSampleStatus(sampleId: string, status: "COLLECTED" | "IN_TRANSIT") {
  return collectorRequest(`/collector/samples/${encodeURIComponent(sampleId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function verifySampleHandoverOtp(sampleId: string, otp: string) {
  return collectorRequest(`/collector/samples/${encodeURIComponent(sampleId)}/handover-otp/verify`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export async function uploadCollectorEvidence(sampleId: string, uri: string, type: "COLLECTION_PHOTO" | "DELIVERY_PROOF") {
  const url = `${LAB_API_BASE_URL}/api/v1/labscan/collector/samples/${encodeURIComponent(sampleId)}/evidence`;
  const upload = (token: string | null) => FileSystem.uploadAsync(url, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "file",
    mimeType: "image/jpeg",
    parameters: { type },
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-user-id": getAuthUserId(),
      "x-user-role": getAuthRole() || "LSC",
    },
  });

  let response = await upload(getAccessToken());
  if (response.status === 401 && getRefreshToken()) {
    response = await upload(await refreshAccessToken());
  }
  const body = JSON.parse(response.body || "{}");
  if (response.status < 200 || response.status >= 300) {
    throw new Error(body?.message || body?.error?.message || "Evidence upload failed.");
  }
  return body?.data !== undefined ? body.data : body;
}
