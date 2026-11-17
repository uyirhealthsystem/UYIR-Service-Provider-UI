import { healthPartnerApi } from "./client";

export function createHealthPartner(data: {
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  districtId: string;
  blockId?: string;
  villageId?: string;
  profilePhotoUrl?: string;
  referralCode?: string;
}) {
  return healthPartnerApi("/health-partners", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getDashboard() {
  return healthPartnerApi("/health-partners/dashboard");
}

export function updateHealthPartner(data: {
  status?: "ACTIVE" | "INACTIVE";
  referralCode?: string;
}) {
  return healthPartnerApi("/health-partners/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getDistricts() {
  return healthPartnerApi("/districts");
}

export function getBlocks(districtId: string) {
  return healthPartnerApi(`/districts/${encodeURIComponent(districtId)}/blocks`);
}

export function getVillages(districtId: string, blockId: string) {
  return healthPartnerApi(`/districts/${encodeURIComponent(districtId)}/blocks/${encodeURIComponent(blockId)}/villages`);
}
