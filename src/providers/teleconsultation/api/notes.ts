import { teleconsultationApi } from "./client";

export type ConsultationNotePayload = {
  symptoms?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  advice?: string;
  followUpAt?: string | null;
};

export const getNotes = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/notes`, { method: "GET" });

export const createNoteDraft = (appointmentId: string, payload: ConsultationNotePayload) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/notes`, { method: "POST", body: JSON.stringify(payload) });

export const updateNoteDraft = (appointmentId: string, noteId: string, payload: ConsultationNotePayload) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/notes/${encodeURIComponent(noteId)}`, { method: "PATCH", body: JSON.stringify(payload) });

export const finalizeNote = (appointmentId: string, noteId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/notes/${encodeURIComponent(noteId)}/finalize`, { method: "POST", body: JSON.stringify({}) });
