import { teleconsultationApi } from "./client";

export type AppointmentConsent = {
  consentType: "TELECONSULTATION";
  signerName: string;
  signerRelationship: string;
  signerAuthority?: string | null;
  consentVersion: string;
  consentText: string;
  signatureMethod: "ELECTRONIC_ATTESTATION";
};

export const getAvailableSlots = (doctorId: string, date: string) =>
  teleconsultationApi(`/teleconsultation/availability/doctors/${encodeURIComponent(doctorId)}?date=${encodeURIComponent(date)}`, { method: "GET" });

export const bookAppointment = (payload: {
  patientId: string;
  bookingFor: string;
  doctorId: string;
  hospitalId: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: "VIDEO";
  reason: string;
}) => teleconsultationApi("/appointment", { method: "POST", body: JSON.stringify(payload) });

export const createConsent = (appointmentId: string, payload: AppointmentConsent) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/consent`, { method: "POST", body: JSON.stringify(payload) });

export const getConsents = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/consent`, { method: "GET" });

export const createOrGetSession = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/session`, { method: "POST", body: JSON.stringify({}) });

export const getSessions = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/sessions`, { method: "GET" });

export const checkInPatient = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/session/check-in`, { method: "POST", body: JSON.stringify({}) });

export const markDoctorDelayed = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/session/delay`, { method: "POST", body: JSON.stringify({}) });

export const startConsultation = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/session/start`, { method: "POST", body: JSON.stringify({}) });

export const endConsultation = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/session/end`, { method: "POST", body: JSON.stringify({}) });

// Doctor-side appointment endpoints from the supplied Postman collection.
export const getDoctorAppointments = (date: string) =>
  teleconsultationApi(`/appointments/me?date=${encodeURIComponent(date)}`, { method: "GET" });

export const getPendingDoctorAppointments = (date: string) =>
  teleconsultationApi(`/appointments/doctor/pending?date=${encodeURIComponent(date)}`, { method: "GET" });

export const confirmDoctorAppointment = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/confirm`, { method: "PATCH" });

export const rejectDoctorAppointment = (appointmentId: string, reason: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });

export const getDoctorJoinToken = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/session/join-token`, { method: "POST", body: JSON.stringify({}) });

export const completeDoctorAppointment = (appointmentId: string) =>
  teleconsultationApi(`/appointments/${encodeURIComponent(appointmentId)}/complete`, { method: "PATCH" });
