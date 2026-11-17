import { proApi } from "./client";

export function pickHospital(data: {
  proId: string;
  hospitals: {
    hospitalPoolId: string;
  }[];
}) {
  console.log("PICK HOSPITAL REQUEST:", JSON.stringify(data, null, 2));

  return proApi("/pro/hospital", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getBucket(proId: string) {
  return proApi(`/pro/${proId}/bucket`);
}

export function releaseHospital(proId: string, proHospitalId: string) {
  return proApi(`/pro/${proId}/bucket/${proHospitalId}/release`, {
    method: "PATCH",
  });
}

export function updateHospitalStatus(
  proHospitalId: string,
  status: "PICKED" | "NO_TIME" | "EXPIRED" | "RELEASED" | "ONBOARDED" | "HOSPITAL_REJECTED",
) {
  return proApi(`/pro/hospital/${proHospitalId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
