import { hbcApi } from "./client";
import type { CareService, CareType } from "./types";

// Public: active services for a care type. No identity headers needed.
export function listServices(careType: CareType) {
  return hbcApi<CareService[]>(`/catalog/services?careType=${careType}`, { auth: false });
}
