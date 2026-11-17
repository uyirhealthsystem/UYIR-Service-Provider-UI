import { asList, istKey, upper } from "./format";

export type Appt = {
  id: string; doctorId: string; doctorName: string; patientName: string; patientPhone: string;
  patientAge?: number; patientGender: string; dateTime: string; token?: number; status: string;
  visitType: string; consultationType: string; reason: string; symptoms: string[];
  bookedFor: string; relationship: string; followUp: any; raw: any;
};

export const normAppt = (a: any, doctorsById: Record<string, any> = {}): Appt => ({
  id: String(a.id ?? a.bookingId ?? ""),
  doctorId: String(a.doctorId ?? a.doctor?.id ?? ""),
  doctorName: a.doctorName || a.doctor?.name || doctorsById[String(a.doctorId ?? "")]?.name || "Doctor",
  patientName: a.patientName || a.patient?.name || "Patient",
  patientPhone: a.patientPhone || a.patient?.phone || "",
  patientAge: a.patientAge ?? a.patient?.age,
  patientGender: upper(a.patientGender || a.patient?.gender),
  dateTime: a.appointmentDateTime || a.scheduledAt || a.dateTime || "",
  token: a.tokenNumber ?? a.token,
  status: upper(a.status) || "CONFIRMED",
  visitType: upper(a.visitType) || "NEW",
  consultationType: upper(a.consultationType) || "IN_PERSON",
  reason: a.reason || "",
  symptoms: Array.isArray(a.symptoms) ? a.symptoms : [],
  bookedFor: upper(a.bookedFor) || "SELF",
  relationship: a.relationship || "",
  followUp: a.followUp || null,
  raw: a,
});

export const isOpenStatus = (s: string) => s === "CONFIRMED" || s === "RESCHEDULED";

export type SeatsInfo = {
  total: number; occupied: number; empty: number; price: number | null;
  seats: { id: string; type: string; doctorId?: string; doctorName?: string }[];
};

export function normSeats(d: any): SeatsInfo {
  const seats: SeatsInfo["seats"] = (Array.isArray(d) ? d : d?.seats || []).map((s: any) => ({
    id: String(s.id ?? s.seatId ?? ""),
    type: upper(s.seatType ?? s.type) || "PAID",
    doctorId: s.doctorId ? String(s.doctorId) : undefined,
    doctorName: s.doctorName || s.doctor?.name,
  }));
  const occupied = d?.occupiedSeats ?? seats.filter((s) => s.doctorId).length;
  const total = d?.totalSeats ?? seats.length;
  const price = d?.pricePerSeat ?? d?.seatPrice ?? d?.price ?? null;
  return { total, occupied, empty: d?.emptySeats ?? Math.max(0, total - occupied), price: price == null ? null : Number(price), seats };
}

export type TokenLimit = { doctorId: string; dailyLimit: number | null; dateLimits: Record<string, number> };
export const normLimits = (d: any): Record<string, TokenLimit> => {
  const out: Record<string, TokenLimit> = {};
  asList(d).forEach((l: any) => {
    const id = String(l.doctorId ?? "");
    if (id) out[id] = { doctorId: id, dailyLimit: l.dailyLimit ?? null, dateLimits: l.dateLimits || {} };
  });
  return out;
};

export const limitFor = (l: TokenLimit | undefined, dateKey: string): number | null => {
  if (!l) return null;
  if (l.dateLimits && l.dateLimits[dateKey] != null) return Number(l.dateLimits[dateKey]);
  return l.dailyLimit == null ? null : Number(l.dailyLimit);
};

export type DoctorRow = {
  id: string; name: string; specialty: string; active: boolean; seated: boolean; seatId?: string;
  seatType?: string; onDuty: boolean; booked: number; completed: number; pending: number;
  limit: number | null; timings: string; fee?: number; raw: any;
};

/**
 * Doctors that belong to this hospital. POST /doctors/list returns EVERY doctor on the platform, so a doctor
 * with no hospitalAssociations entry for us must not be shown — the backend refuses to seat or check them in
 * ("has no hospitalAssociations entry for hospital ...").
 */
const belongs = (d: any, hospitalId: string) => {
  const a = d?.hospitalAssociations;
  if (!hospitalId) return false;
  return Array.isArray(a) && a.some((x: any) => String(x.hospitalId) === hospitalId);
};

export function buildDoctorRows(
  doctors: any[], seats: SeatsInfo | null, appts: Appt[], limits: Record<string, TokenLimit>,
  hospitalId: string, dateKey: string,
): DoctorRow[] {
  const seatByDoctor: Record<string, SeatsInfo["seats"][number]> = {};
  seats?.seats.forEach((s) => s.doctorId && (seatByDoctor[s.doctorId] = s));
  return doctors.filter((d) => belongs(d, hospitalId)).map((d) => {
    const id = String(d.id);
    const day = appts.filter((a) => a.doctorId === id && istKey(a.dateTime) === dateKey && a.status !== "CANCELLED");
    const seat = seatByDoctor[id];
    return {
      id, name: d.name || "Doctor", specialty: (d.specialties || []).join(", ") || "General",
      active: d.active !== false, seated: !!seat, seatId: seat?.id, seatType: seat?.type,
      onDuty: !!hospitalId && (String(d.currentHospitalId ?? "") === hospitalId || d.checkedIn === true || d.onDuty === true),
      booked: day.length,
      completed: day.filter((a) => a.status === "COMPLETED").length,
      pending: day.filter((a) => isOpenStatus(a.status)).length,
      limit: limitFor(limits[id], dateKey),
      timings: d.availability?.customTimings || d.availability?.type || "",
      fee: d.consultationFee, raw: d,
    };
  });
}
