import type { DriverProfile, DriverProfileRequest } from "../types";
import { ambulanceApi } from "./client";

export function getMyProfile() {
  return ambulanceApi<DriverProfile>("/driver/profile");
}

export function createMyProfile(data: DriverProfileRequest) {
  return ambulanceApi<DriverProfile>("/driver/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** The server refuses this while the driver is on a trip. */
export function updateMyProfile(data: DriverProfileRequest) {
  return ambulanceApi<DriverProfile>("/driver/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
