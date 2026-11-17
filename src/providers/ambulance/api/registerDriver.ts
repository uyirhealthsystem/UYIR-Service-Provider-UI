import { createMyProfile } from "./profile";

export async function registerAmbulanceDriver(payload: {
  fullName: string;
  phone: string;
  licenseNumber: string;
  plateNumber: string;
  ambulanceType: "NORMAL" | "BLS" | "VENTILATOR";
  districtId: string;
}) {
  return createMyProfile(payload);
}
