import { ambulanceApi } from "./client";

export function updateDriverStatus(data: {
  online: boolean;
  lat?: number;
  lng?: number;
}) {
  return ambulanceApi("/driver/status", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function sendDriverLocation(data: {
  lat: number;
  lng: number;
  heading?: number;
}) {
  return ambulanceApi("/driver/location", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
