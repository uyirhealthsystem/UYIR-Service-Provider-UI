import { ambulanceApi } from "./client";

export function getMyProfile() {
  return ambulanceApi("/driver/profile");
}

export function createMyProfile(data: {
  fullName: string;
  phone: string;
  licenseNumber: string;
  plateNumber: string;
  ambulanceType: string;
  districtId: string;
}) {
  return ambulanceApi("/driver/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMyProfile(data: Record<string, unknown>) {
  return ambulanceApi("/driver/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
