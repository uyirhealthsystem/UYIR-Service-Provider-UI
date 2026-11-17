import { ambulanceApi } from "./client";

export function getMyTechnicians() {
  return ambulanceApi("/driver/technicians");
}

export function addTechnician(data: {
  fullName: string;
  phone: string;
  qualification?: string;
  certificationNumber?: string;
  available?: boolean;
}) {
  return ambulanceApi("/driver/technicians", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTechnician(
  technicianId: string,
  data: {
    fullName: string;
    phone: string;
    qualification?: string;
    certificationNumber?: string;
    available?: boolean;
  },
) {
  return ambulanceApi(`/driver/technicians/${technicianId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removeTechnician(technicianId: string) {
  return ambulanceApi(`/driver/technicians/${technicianId}`, {
    method: "DELETE",
  });
}
