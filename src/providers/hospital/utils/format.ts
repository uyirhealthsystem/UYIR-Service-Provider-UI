// All backend times are UTC ISO-8601. Hospitals operate in IST (UTC+05:30), so every
// display / date-bucketing helper here works in IST without depending on device timezone.
const IST_OFFSET_MS = 330 * 60000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const pad = (n: number) => String(n).padStart(2, "0");

const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** yyyy-MM-dd of an instant, in IST. */
export const istKey = (input: string | number | Date): string => ymd(new Date(new Date(input).getTime() + IST_OFFSET_MS));
export const todayKey = (): string => istKey(Date.now());

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return ymd(new Date(Date.UTC(y, m - 1, d + n)));
}

export function fmtTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(new Date(iso).getTime() + IST_OFFSET_MS);
  const h = d.getUTCHours();
  return `${h % 12 || 12}:${pad(d.getUTCMinutes())} ${h >= 12 ? "PM" : "AM"}`;
}

export function fmtDateKey(key: string, withWeekday = true): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${withWeekday ? DAYS[dt.getUTCDay()] + ", " : ""}${d} ${MONTHS[m - 1]} ${y}`;
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return `${fmtDateKey(istKey(iso))} · ${fmtTime(iso)}`;
}

export function dayLabel(key: string): string {
  const t = todayKey();
  if (key === t) return "Today";
  if (key === addDays(t, 1)) return "Tomorrow";
  if (key === addDays(t, -1)) return "Yesterday";
  return fmtDateKey(key);
}

/** IST calendar date + "HH:mm" → UTC ISO string for the API. */
export function istToIso(key: string, hhmm: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, min) - IST_OFFSET_MS).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export const asList = (d: any): any[] =>
  Array.isArray(d) ? d : d?.content || d?.items || d?.bookings || d?.doctors || d?.seats || [];

export const upper = (v: unknown) => String(v ?? "").toUpperCase();

export function minutesAgo(iso?: string | null): string {
  if (!iso) return "";
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ${m % 60} min ago`;
}

/** ₹1,234.50 (Indian digit grouping). */
export function money(v: unknown, currency = "INR"): string {
  const n = Number(v ?? 0);
  const sym = currency === "INR" ? "₹" : `${currency} `;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const last3 = int.slice(-3), rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `${n < 0 ? "-" : ""}${sym}${grouped}${dec === "00" ? "" : `.${dec}`}`;
}

/** "2026-11" → "November 2026". */
export function monthLabel(period?: string | null): string {
  if (!period) return "—";
  const [y, m] = period.split("-").map(Number);
  const full = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return full[m - 1] ? `${full[m - 1]} ${y}` : period;
}

export const fmtDate = (iso?: string | null): string => (iso ? fmtDateKey(istKey(iso), false) : "—");
