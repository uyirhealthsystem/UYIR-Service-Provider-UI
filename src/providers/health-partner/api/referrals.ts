import { healthPartnerApi } from "./client";

export function createCitizenReferral(referredUserId: string, referralCode: string) {
  return healthPartnerApi("/referrals", {
    method: "POST",
    body: JSON.stringify({
      referralCode,
      referredUserId,
      referredType: "CITIZEN",
    }),
  });
}

export function getReferrals() {
  return healthPartnerApi("/referrals");
}
