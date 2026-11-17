import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getAppointments, getDoctorSeats, getDoctors, getTokenLimits } from "../api/hospital";
import { useHospitalStore } from "../features/provider-state/store";
import {
  buildDoctorRows, normAppt, normLimits, normSeats, type Appt, type SeatsInfo, type TokenLimit,
} from "../utils/derive";
import { asList, todayKey } from "../utils/format";

/**
 * One loader for doctors + seats + token limits + appointments.
 * Reloads when the screen gains focus and (silently) whenever the live socket reports a change.
 */
export function useHospitalData() {
  const { hospitalId, revision } = useHospitalStore();
  const [rawDoctors, setRawDoctors] = useState<any[]>([]);
  const [seats, setSeats] = useState<SeatsInfo | null>(null);
  const [limits, setLimits] = useState<Record<string, TokenLimit>>({});
  const [rawAppts, setRawAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [d, s, l, a] = await Promise.allSettled([getDoctors(), getDoctorSeats(), getTokenLimits(), getAppointments()]);
    if (d.status === "fulfilled") setRawDoctors(asList(d.value));
    if (s.status === "fulfilled") setSeats(normSeats(s.value));
    if (l.status === "fulfilled") setLimits(normLimits(l.value));
    if (a.status === "fulfilled") setRawAppts(asList(a.value));
    const failed = [d, s, a].find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
    setError(failed ? failed.reason?.message || "Unable to load hospital data." : "");
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  // Live updates: coalesce bursts of socket messages into one quiet refetch.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => load(true), 400);
    return () => clearTimeout(t);
  }, [revision, load]);

  const doctorsById = useMemo(() => Object.fromEntries(rawDoctors.map((d) => [String(d.id), d])), [rawDoctors]);
  const appointments: Appt[] = useMemo(() => rawAppts.map((a) => normAppt(a, doctorsById)), [rawAppts, doctorsById]);
  const rowsFor = useCallback(
    (dateKey: string) => buildDoctorRows(rawDoctors, seats, appointments, limits, hospitalId, dateKey),
    [rawDoctors, seats, appointments, limits, hospitalId],
  );
  const today = todayKey();
  const rows = useMemo(() => rowsFor(today), [rowsFor, today]);

  return { rawDoctors, doctorsById, seats, limits, appointments, rows, rowsFor, loading, error, reload: () => load(false) };
}
