import { hospitalApi } from "./client";

const json = (body: unknown) => JSON.stringify(body);
const enc = encodeURIComponent;

/* ───────────── Hospital profile ───────────── */
export const getHospitalProfile = (hospitalId: string) => hospitalApi<any>(`/${enc(hospitalId)}`);
export const getMyHospital = () => hospitalApi<any>("/me");
// Links this HOSPITAL login to a hospital a PRO onboarded, using the id + one-time claim code from the email.
export const claimHospital = (hospitalId: string, claimCode: string) =>
  hospitalApi<any>("/claim", { method: "POST", body: json({ hospitalId: hospitalId.trim(), claimCode: claimCode.trim() }) });
export const toggleEmergencyServices = (hospitalId: string, handlesEmergencies: boolean) =>
  hospitalApi<any>(`/${enc(hospitalId)}/emergency-services/toggle`, { method: "PATCH", body: json({ handlesEmergencies }) });

/* ───────────── Doctors ───────────── */
export const getDoctors = () => hospitalApi<any>("/doctors/list", { method: "POST", body: json({}) });
export const searchDoctors = (filters: Record<string, unknown> = {}) =>
  hospitalApi<any>("/doctors/search?page=0&size=100&sort=name,asc", { method: "POST", body: json(filters) });
export const createDoctor = (body: Record<string, unknown>) => hospitalApi<any>("/doctors", { method: "POST", body: json(body) });
export const updateDoctor = (id: string, body: Record<string, unknown>) => hospitalApi<any>(`/doctors/${enc(id)}`, { method: "PUT", body: json(body) });
export const setDoctorActive = (id: string, active: boolean) =>
  hospitalApi<any>(`/doctors/${enc(id)}${active ? "/activate" : ""}`, { method: active ? "PATCH" : "DELETE" });
/** On/off availability toggle: check the doctor in (ON) or out (OFF) of this hospital. */
export const checkInDoctor = (id: string, hospitalId: string) =>
  hospitalApi<any>(`/doctors/${enc(id)}/check-in`, { method: "POST", body: json({ hospitalId }) });
export const checkOutDoctor = (id: string) => hospitalApi<any>(`/doctors/${enc(id)}/check-out`, { method: "POST" });
export const getSpecialties = () => hospitalApi<any>("/specialties");
export const getEmergencyConditions = () => hospitalApi<any>("/emergency-conditions");

/* ───────────── Seats (1 free, rest are purchased) ───────────── */
export const getDoctorSeats = () => hospitalApi<any>("/seats");
export const assignDoctorToSeat = (seatId: string, doctorId: string) =>
  hospitalApi<any>(`/seats/${enc(seatId)}/doctor`, { method: "PUT", body: json({ doctorId }) });
export const removeDoctorFromSeat = (seatId: string) => hospitalApi<any>(`/seats/${enc(seatId)}/doctor`, { method: "DELETE" });
export const buySeats = (quantity: number) => hospitalApi<any>("/seats/purchases", { method: "POST", body: json({ quantity }) });
export const retrySeatPayment = (purchaseId: string) => hospitalApi<any>(`/seats/purchases/${enc(purchaseId)}/payment`, { method: "POST" });
export const getSeatPurchases = () => hospitalApi<any>("/seats/purchases");

/* ───────────── Token limits ───────────── */
export const getTokenLimits = () => hospitalApi<any>("/token-limits");
export const setDailyTokenLimit = (doctorId: string, dailyLimit: number | null) =>
  hospitalApi<any>(`/token-limits/${enc(doctorId)}`, { method: "PUT", body: json({ dailyLimit }) });
export const setDateTokenLimit = (doctorId: string, date: string, limit: number) =>
  hospitalApi<any>(`/token-limits/${enc(doctorId)}/dates/${enc(date)}`, { method: "PUT", body: json({ limit }) });
export const removeDateTokenLimit = (doctorId: string, date: string) =>
  hospitalApi<any>(`/token-limits/${enc(doctorId)}/dates/${enc(date)}`, { method: "DELETE" });

/* ───────────── Appointments ───────────── */
export const getAppointments = () => hospitalApi<any>("/doctor-appointments");
export const updateAppointmentStatus = (id: string, status: string) =>
  hospitalApi<any>(`/doctor-appointments/${enc(id)}/status`, { method: "PATCH", body: json({ status }) });
/** Close the visit and (optionally) ask the patient to come back, in one call. */
export const completeAppointment = (id: string, followUp?: { afterDays?: number; date?: string; instructions?: string }) =>
  hospitalApi<any>(`/doctor-appointments/${enc(id)}/status`, {
    method: "PATCH",
    body: json(followUp ? { status: "COMPLETED", followUp } : { status: "COMPLETED" }),
  });
export const rescheduleAppointment = (id: string, body: Record<string, unknown>) =>
  hospitalApi<any>(`/doctor-appointments/${enc(id)}/reschedule`, { method: "PATCH", body: json(body) });
export const cancelAppointment = (id: string, reason: string) =>
  hospitalApi<any>(`/doctor-appointments/${enc(id)}/cancel`, { method: "PATCH", body: json({ reason }) });
export const setFollowUp = (id: string, body: { afterDays?: number; date?: string; instructions?: string }) =>
  hospitalApi<any>(`/doctor-appointments/${enc(id)}/follow-up`, { method: "PUT", body: json(body) });
export const removeFollowUp = (id: string) => hospitalApi<any>(`/doctor-appointments/${enc(id)}/follow-up`, { method: "DELETE" });

/* ───────────── Emergency bookings ───────────── */
export const getEmergencyBookings = () => hospitalApi<any>("/emergency-bookings");
export const acceptEmergencyBooking = (id: string) => hospitalApi<any>(`/emergency-bookings/${enc(id)}/accept`, { method: "PATCH" });
export const rejectEmergencyBooking = (id: string, reason: string) =>
  hospitalApi<any>(`/emergency-bookings/${enc(id)}/reject`, { method: "PATCH", body: json({ reason }) });
export const completeEmergencyBooking = (id: string) => hospitalApi<any>(`/emergency-bookings/${enc(id)}/complete`, { method: "PATCH" });

/** The ambulance bringing an accepted emergency's patient (once the patient booked one): position, ETA, driver. */
export type IncomingAmbulance = {
  emergencyBookingId: string;
  ambulanceBookingId: string;
  patientName?: string;
  patientPhone?: string;
  emergencyType?: string;
  /** Ambulance ride status: SEARCHING, EN_ROUTE_TO_PICKUP, ARRIVED, PICKED_UP, PAYMENT_PENDING, COMPLETED, CANCELLED, NO_AMBULANCE_FOUND. */
  status: string;
  patientOnBoard: boolean;
  ambulanceType?: string | null;
  pickup?: { lat: number; lng: number; address?: string | null } | null;
  destination?: { lat: number; lng: number; address?: string | null } | null;
  driver?: { name: string; phone: string; plateNumber: string; ambulanceType?: string | null } | null;
  /** Only while the ride is under way. */
  location?: { lat: number; lng: number; heading?: number | null; updatedAt: string } | null;
  /** To the patient before pickup, to this hospital after. */
  etaMinutes?: number | null;
  distanceKm?: number | null;
  bookedAt?: string;
};
export const getIncomingAmbulance = (id: string) => hospitalApi<IncomingAmbulance>(`/emergency-bookings/${enc(id)}/ambulance`);

/* ───────────── Metrics ───────────── */
export const getMyHospitalMetrics = (body: Record<string, unknown> = {}) =>
  hospitalApi<any>("/metrics/my-hospital", { method: "POST", body: json(body) });

/* ───────────── Hospital profile (edit) ───────────── */
export const updateHospital = (id: string, body: Record<string, unknown>) =>
  hospitalApi<any>(`/${enc(id)}`, { method: "PUT", body: json(body) });

/* ───────────── Doctor dashboard (hospital-only) ───────────── */
export const getDoctorDashboard = (doctorId: string, from?: string, to?: string) => {
  const q = [from && `from=${enc(from)}`, to && `to=${enc(to)}`].filter(Boolean).join("&");
  return hospitalApi<any>(`/doctor-appointments/doctors/${enc(doctorId)}/dashboard${q ? `?${q}` : ""}`);
};
export const getTokenAvailability = (hospitalId: string, doctorId: string, date: string) =>
  hospitalApi<any>(`/doctor-appointments/availability?hospitalId=${enc(hospitalId)}&doctorId=${enc(doctorId)}&date=${enc(date)}`);

/* ───────────── Analytics (own hospital) ───────────── */
export const getMyHospitalAnalytics = (body: { fromDate?: string; toDate?: string } = {}) =>
  hospitalApi<any>("/analytics/my-hospital", { method: "POST", body: json(body) });

/* ───────────── Commission invoices ───────────── */
export const getInvoices = () => hospitalApi<any>("/invoices");
export const getInvoice = (id: string) => hospitalApi<any>(`/invoices/${enc(id)}`);
export const getInvoiceAppointments = (id: string) => hospitalApi<any>(`/invoices/${enc(id)}/appointments`);
export const payInvoice = (id: string) => hospitalApi<any>(`/invoices/${enc(id)}/payment`, { method: "POST" });

/* ───────────── Payout account (Razorpay Route) ───────────── */
export const getPayoutAccount = () => hospitalApi<any>("/payout-account");
export const savePayoutAccount = (body: Record<string, unknown>) =>
  hospitalApi<any>("/payout-account", { method: "PUT", body: json(body) });
