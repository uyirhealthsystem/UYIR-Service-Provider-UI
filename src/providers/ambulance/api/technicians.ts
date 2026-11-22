import type { Technician, TechnicianRequest } from "../types";
import { ambulanceApi } from "./client";

export function getMyTechnicians() {
  return ambulanceApi<Technician[]>("/driver/technicians");
}

export function addTechnician(data: TechnicianRequest) {
  return ambulanceApi<Technician>("/driver/technicians", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTechnician(technicianId: string, data: TechnicianRequest) {
  return ambulanceApi<Technician>(`/driver/technicians/${technicianId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removeTechnician(technicianId: string) {
  return ambulanceApi<null>(`/driver/technicians/${technicianId}`, {
    method: "DELETE",
  });
}
