import { teleconsultationApi } from "./client";

export const getPrescription = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/prescription/me`, { method: "GET" });

export const createPrescriptionDraft = (appointmentId: string, instructions: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/prescription`, { method: "POST", body: JSON.stringify({ instructions }) });

export const updatePrescriptionInstructions = (appointmentId: string, instructions: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/prescription`, { method: "PATCH", body: JSON.stringify({ instructions }) });

export const addMedicine = (appointmentId: string, payload: {
  medicineName: string; dosage: string; frequency: string; duration: string;
  quantity: number; instructions?: string; sortOrder?: number;
}) => teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/prescription`, { method: "POST", body: JSON.stringify({ instructions: payload.instructions || "", items: [{ ...payload, instructions: undefined }] }) });

export const issuePrescription = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/prescription/issue`, { method: "POST", body: JSON.stringify({}) });

export const updateMedicine = (appointmentId: string, itemId: string, payload: { medicineName?: string; dosage?: string; frequency?: string; duration?: string; quantity?: number; instructions?: string }) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/prescription/items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: JSON.stringify(payload) });

export const removeMedicine = (appointmentId: string, itemId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/prescription/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
