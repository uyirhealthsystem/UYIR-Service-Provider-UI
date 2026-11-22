import { healthPartnerApi } from "./client";

// Citizen referrals are created by userservice when a villager signs up with
// the HP's code (the HP service removed POST /referrals), so the app only
// reads them.
export function getReferrals() {
  return healthPartnerApi("/referrals");
}
