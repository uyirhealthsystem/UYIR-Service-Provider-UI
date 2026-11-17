import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../../../auth/session";
import { getUserIdFromAccessToken } from "../../../../../auth/token";
import { acceptBooking as apiAcceptBooking, getAllBookings, rejectBooking as apiRejectBooking } from "../../../api/bookings";
import { getMyECGProvider, getProviderDashboard } from "../../../api/provider";

export type ECGBooking = {
  id: string;
  patient: string;
  age?: number;
  gender?: string;
  date?: string;
  time?: string;
  address?: string;
  distance?: string;
  notes?: string;
  amount?: number;
  status: string;
  raw: any;
};

type ECGStore = {
  provider: any | null;
  providerLoading: boolean;
  requests: ECGBooking[];
  activeBooking: ECGBooking | null;
  completedBookings: ECGBooking[];
  dashboard: any;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  acceptBooking: (booking: ECGBooking) => Promise<ECGBooking | null>;
  rejectBooking: (booking: ECGBooking, reason?: string) => Promise<void>;
  setActiveBooking: (booking: ECGBooking | null) => void;
};

const Context = createContext<ECGStore | null>(null);

const ACTIVE_STATUSES = ["ACCEPTED", "ON_THE_WAY", "REACHED", "STARTED", "IN_PROGRESS"];
const REQUEST_STATUSES = ["NEW", "PENDING", "ASSIGNED", "REQUESTED", "CONFIRMED"];
const COMPLETED_STATUSES = ["COMPLETED"];

function valueOf(item: any, keys: string[]) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function normalizeBooking(item: any): ECGBooking {
  const patient = item?.patient || item?.customer || item?.citizen || {};
  const location = item?.location || item?.patientLocation || {};
  const dateTime = item?.appointmentDate || item?.scheduledDate || item?.date;

  return {
    id: String(item?.id || item?.bookingId || ""),
    patient: String(valueOf(item, ["patientName"]) || patient?.name || "Patient"),
    age: Number(valueOf(item, ["patientAge", "age"]) || patient?.age || 0) || undefined,
    gender: String(valueOf(item, ["patientSex", "gender"]) || patient?.gender || ""),
    date: dateTime ? new Date(dateTime).toLocaleDateString() : String(item?.date || ""),
    time: String(valueOf(item, ["startTime", "time", "appointmentTime"]) || ""),
    address: String(valueOf(item, ["address", "patientAddress"]) || location?.address || ""),
    distance: String(valueOf(item, ["distance", "pickupDistance"]) || ""),
    notes: String(valueOf(item, ["notes", "patientNotes"]) || ""),
    amount: Number(valueOf(item, ["amount", "price", "serviceAmount", "totalAmount"]) || 0),
    status: String(item?.status || "NEW").toUpperCase(),
    raw: item,
  };
}

function matchesECG(item: any) {
  const values = [item?.serviceType, item?.providerType, item?.bookingType, item?.service, item?.serviceName, item?.type]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());

  if (!values.length) return true;
  return values.some((value) => value.includes("ECG"));
}

function belongsToProvider(item: any, providerId: string, userId: string) {
  const ids = [
    item?.providerId,
    item?.assignedProviderId,
    item?.provider?.id,
    item?.provider?.providerId,
    item?.provider?.userId,
    item?.assignedProvider?.id,
    item?.assignedProvider?.providerId,
    item?.assignedProvider?.userId,
  ].filter(Boolean).map(String);

  if (ids.includes(String(providerId)) || ids.includes(String(userId))) return true;

  // Unassigned requests are eligible to be shown to the provider.
  return !ids.length && REQUEST_STATUSES.includes(String(item?.status || "").toUpperCase());
}

export function ECGProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<any | null>(null);
  const [requests, setRequests] = useState<ECGBooking[]>([]);
  const [activeBooking, setActiveBookingState] = useState<ECGBooking | null>(null);
  const [completedBookings, setCompletedBookings] = useState<ECGBooking[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [providerLoading, setProviderLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAccessToken();
      const userId = getUserIdFromAccessToken(token);
      if (!userId) throw new Error("JWT sub is missing. Please login again.");

      let currentProvider = provider;
      if (!currentProvider) {
        setProviderLoading(true);
        currentProvider = await getMyECGProvider(userId);
        setProvider(currentProvider);
        setProviderLoading(false);
      }

      if (!currentProvider?.id && !currentProvider?.providerId) {
        setRequests([]);
        setActiveBookingState(null);
        setCompletedBookings([]);
        return;
      }

      const providerId = String(currentProvider?.id || currentProvider?.providerId);
      const [bookingsResponse, dashboardResponse] = await Promise.all([
        getAllBookings(),
        getProviderDashboard(providerId).catch((dashboardError) => {
          console.log("ECG dashboard API unavailable:", dashboardError);
          return null;
        }),
      ]);

      const rawBookings = Array.isArray(bookingsResponse)
        ? bookingsResponse
        : bookingsResponse?.bookings || bookingsResponse?.data || bookingsResponse?.items || [];

      const relevant = rawBookings
        .filter(matchesECG)
        .filter((item: any) => belongsToProvider(item, providerId, userId))
        .map(normalizeBooking)
        .filter((item: ECGBooking) => Boolean(item.id));

      const active = relevant.find((item) => ACTIVE_STATUSES.includes(item.status)) || null;
      const incoming = relevant
        .filter((item) => REQUEST_STATUSES.includes(item.status))
        .filter((item) => !active || item.id !== active.id)
        .slice(0, 1);
      const completed = relevant.filter((item) => COMPLETED_STATUSES.includes(item.status));

      setActiveBookingState(active);
      setRequests(active ? [] : incoming);
      setCompletedBookings(completed);
      setDashboard(dashboardResponse || {});
    } catch (refreshError: any) {
      console.log("ECG refresh error:", refreshError);
      setError(refreshError?.message || "Unable to load ECG data");
    } finally {
      setLoading(false);
      setProviderLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const acceptBooking = async (booking: ECGBooking) => {
    if (activeBooking) return null;
    const providerId = String(provider?.id || provider?.providerId || "");
    if (!providerId) throw new Error("ECG provider ID is missing.");

    const response = await apiAcceptBooking(booking.id, providerId);
    const accepted = normalizeBooking(response || { ...booking.raw, status: "ACCEPTED", providerId });
    setActiveBookingState(accepted);
    setRequests([]);
    return accepted;
  };

  const rejectBooking = async (booking: ECGBooking, reason = "Provider unavailable") => {
    const providerId = String(provider?.id || provider?.providerId || "");
    if (!providerId) throw new Error("ECG provider ID is missing.");
    await apiRejectBooking(booking.id, providerId, reason);
    setRequests((items) => items.filter((item) => item.id !== booking.id));
    await refresh();
  };

  const value = useMemo(() => ({
    provider,
    providerLoading,
    requests,
    activeBooking,
    completedBookings,
    dashboard,
    loading,
    error,
    refresh,
    acceptBooking,
    rejectBooking,
    setActiveBooking: setActiveBookingState,
  }), [provider, providerLoading, requests, activeBooking, completedBookings, dashboard, loading, error]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useECG() {
  const value = useContext(Context);
  if (!value) throw new Error("useECG must be used inside ECGProvider");
  return value;
}
