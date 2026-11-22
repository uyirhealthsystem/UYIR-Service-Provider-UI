import type {
  DriverLocationRequest,
  DriverStatus,
  DriverStatusRequest,
} from "../types";
import { ambulanceApi } from "./client";

export function updateDriverStatus(data: DriverStatusRequest) {
  return ambulanceApi<{ status: DriverStatus }>("/driver/status", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function sendDriverLocation(data: DriverLocationRequest) {
  return ambulanceApi<{ ok: boolean }>("/driver/location", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
