import { authFetch } from "../../../auth/session";
import { proAuthHeader, proUrl } from "./client";

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error?.message || "PRO registration request failed.");
  }
  return data;
}

export async function sendProAbhaOtp(abhaNumber: string, userId: string) {
  const response = await authFetch(proUrl("/pro/abha/otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...proAuthHeader(), "x-user-id": userId },
    body: JSON.stringify({ abhaNumber: abhaNumber.trim(), otpMethod: "abdm" }),
  });
  return parseResponse(response);
}

export async function registerPro(data: {
  userId: string;
  otp: string;
  name: string;
  phone: string;
  districtId: string;
  joiningDate: string;
}) {
  const response = await authFetch(proUrl("/pro"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...proAuthHeader(), "x-user-id": data.userId },
    body: JSON.stringify({
      otp: data.otp.trim(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      districtId: data.districtId.trim(),
      joiningDate: data.joiningDate.trim(),
    }),
  });
  return parseResponse(response);
}
