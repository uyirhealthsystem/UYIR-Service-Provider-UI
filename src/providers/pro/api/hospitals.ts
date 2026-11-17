import { proApi } from "./client";

export function getAvailableHospitals(proId: string) {
  return proApi(`/hospitalpool/available/${proId}`);
}

export function getProHospitals() {
  return proApi("/pro/me/hospitals");
}
