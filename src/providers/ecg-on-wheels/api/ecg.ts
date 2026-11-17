import { ecgApi, unwrapObject } from "./client";

export async function generateOTP(bookingId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/otp`, { method: "POST" }));
}

export async function verifyOTP(bookingId: string, otp: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/otp/verify`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  }));
}

export async function createCapture(bookingId: string, payload: any) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/capture`, {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function getCapture(bookingId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/capture`));
}

export async function updateCapture(bookingId: string, payload: any) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/updatecapture`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }));
}

export async function uploadReport(bookingId: string, file: { uri: string; name: string; type: string }) {
  const formData = new FormData();
  formData.append("file", { uri: file.uri, name: file.name, type: file.type } as any);
  return unwrapObject(await ecgApi(`/booking/${bookingId}/report`, {
    method: "POST",
    body: formData,
  }));
}

export async function getReport(bookingId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/reports`));
}

export async function updateReport(bookingId: string, payload: any) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/report`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }));
}
