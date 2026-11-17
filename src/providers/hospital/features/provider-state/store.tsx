import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { AppState } from "react-native";
import { getHospitalAuthContext } from "../../api/client";
import {
  getEmergencyBookings, getMyHospital, toggleEmergencyServices,
} from "../../api/hospital";
import { HospitalSocket, type BookingEvent, type SocketStatus } from "../../realtime/socketClient";
import { asList, upper } from "../../utils/format";

export type EmergencyItem = {
  id: string;
  patientName: string;
  emergencyType: string;
  patientPhone: string;
  createdAt: string;
  addedAt: number;
  /** Patient withdrew the request — nothing left to accept/decline, only to dismiss. */
  cancelled?: boolean;
};

type HospitalStoreValue = {
  hospital: any | null;
  /** "missing" = this login has not registered a hospital yet (GET /me → 404). */
  profileStatus: "loading" | "ready" | "missing" | "error";
  setHospital: (h: any) => void;
  hospitalId: string;
  setHospitalId: (id: string) => void;
  refreshHospital: () => Promise<void>;
  handlesEmergencies: boolean;
  setHandlesEmergencies: (on: boolean) => Promise<void>;

  socketStatus: SocketStatus;
  reconnectSocket: () => void;
  /** Increments whenever the server says a booking changed (or after every reconnect). */
  revision: number;

  emergencyQueue: EmergencyItem[];
  refreshEmergencies: () => Promise<void>;
  removeEmergency: (id: string) => void;
};

const HospitalStore = createContext<HospitalStoreValue | null>(null);

const mapEmergency = (b: any): EmergencyItem => ({
  id: String(b.id ?? b.bookingId),
  patientName: b.patientName || b.patient?.name || "Patient",
  emergencyType: b.emergencyType || b.condition || "Emergency",
  patientPhone: b.patientPhone || b.patient?.phone || "",
  createdAt: b.createdAt || b.requestedAt || "",
  addedAt: Date.now(),
});

const sortOldestFirst = (list: EmergencyItem[]) =>
  [...list].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [hospital, setHospital] = useState<any | null>(null);
  const [hospitalId, setHospitalId] = useState("");
  const [profileStatus, setProfileStatus] = useState<HospitalStoreValue["profileStatus"]>("loading");
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("idle");
  const [revision, setRevision] = useState(0);
  const [emergencyQueue, setEmergencyQueue] = useState<EmergencyItem[]>([]);

  const refreshHospital = useCallback(async () => {
    try {
      const h = await getMyHospital();
      setHospital(h);
      setHospitalId(String(h?.id ?? h?.hospitalId ?? ""));
      setProfileStatus("ready");
    } catch (e: any) {
      setProfileStatus((prev) => (e?.status === 404 ? "missing" : prev === "ready" ? "ready" : "error"));
    }
  }, []);

  const handlesEmergencies = hospital?.emergencyServices?.handlesEmergencies !== false;

  const setHandlesEmergencies = useCallback(async (on: boolean) => {
    if (!hospitalId) throw new Error("Hospital profile not loaded yet.");
    const updated = await toggleEmergencyServices(hospitalId, on);
    setHospital((prev: any) => updated && updated.id
      ? updated
      : { ...(prev || {}), emergencyServices: { ...(prev?.emergencyServices || {}), handlesEmergencies: on } });
  }, [hospitalId]);

  /** REST is the truth: reconcile the emergency queue with what the server says is still REQUESTED. */
  const refreshEmergencies = useCallback(async () => {
    try {
      const list = asList(await getEmergencyBookings());
      const requested = list.filter((b: any) => upper(b.status) === "REQUESTED").map(mapEmergency);
      const restIds = new Set(requested.map((r) => r.id));
      setEmergencyQueue((prev) => {
        const prevById = new Map(prev.map((p) => [p.id, p]));
        const merged = requested.map((r) => ({ ...r, addedAt: prevById.get(r.id)?.addedAt ?? r.addedAt }));
        prev.forEach((p) => {
          if (restIds.has(p.id)) return;
          const handledElsewhere = list.some((b: any) => String(b.id) === p.id);
          if (p.cancelled) merged.push(p); // keep until the nurse dismisses it
          else if (!handledElsewhere && Date.now() - p.addedAt < 15_000) merged.push(p); // socket beat REST
        });
        return sortOldestFirst(merged);
      });
    } catch { /* offline: keep whatever we have */ }
  }, []);

  const removeEmergency = useCallback((id: string) => {
    setEmergencyQueue((q) => q.filter((e) => e.id !== id));
  }, []);

  /* ───────── socket event handling ───────── */
  const onEvent = useCallback((e: BookingEvent) => {
    const id = e.bookingId ? String(e.bookingId) : "";
    switch (e.type) {
      case "EMERGENCY_REQUESTED":
        if (id) {
          setEmergencyQueue((q) => q.some((x) => x.id === id) ? q : sortOldestFirst([...q, {
            id, patientName: e.patientName || "Patient", emergencyType: e.emergencyType || "Emergency",
            patientPhone: "", createdAt: e.occurredAt || new Date().toISOString(), addedAt: Date.now(),
          }]));
        }
        refreshEmergencies(); // fetch the full record
        break;
      case "EMERGENCY_CANCELLED":
        setEmergencyQueue((q) => q.map((x) => (x.id === id ? { ...x, cancelled: true } : x)));
        break;
      case "EMERGENCY_ACCEPTED":
      case "EMERGENCY_REJECTED":
      case "EMERGENCY_COMPLETED":
        removeEmergency(id); // handled (maybe from another device)
        break;
      default:
        break; // appointment events + unknown types: just refresh data below
    }
    setRevision((r) => r + 1);
  }, [refreshEmergencies, removeEmergency]);

  const onResync = useCallback(() => {
    refreshEmergencies();
    setRevision((r) => r + 1);
  }, [refreshEmergencies]);

  /* ───────── one socket per app, closed in the background ───────── */
  const socketRef = useRef<HospitalSocket | null>(null);
  const handlersRef = useRef({ onEvent, onResync });
  handlersRef.current = { onEvent, onResync };

  useEffect(() => {
    const socket = new HospitalSocket(
      () => {
        const { token, userId, role } = getHospitalAuthContext();
        const r = String(role || "").toUpperCase();
        return { token, userId, role: r.includes("HOSPITAL") ? "HOSPITAL" : r };
      },
      {
        onStatus: setSocketStatus,
        onEvent: (e) => handlersRef.current.onEvent(e),
        onResync: () => handlersRef.current.onResync(),
      },
    );
    socketRef.current = socket;
    refreshHospital();
    refreshEmergencies();
    if (AppState.currentState === "active") socket.start();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") socket.stop();
      else if (state === "active") { socket.start(); refreshEmergencies(); }
    });
    return () => { sub.remove(); socket.stop(); socketRef.current = null; };
  }, [refreshHospital, refreshEmergencies]);

  // Safety net: if the socket is down, poll so an emergency is never missed.
  useEffect(() => {
    if (socketStatus === "open") return;
    const t = setInterval(() => {
      if (AppState.currentState === "active") refreshEmergencies();
    }, 15_000);
    return () => clearInterval(t);
  }, [socketStatus, refreshEmergencies]);

  const reconnectSocket = useCallback(() => { socketRef.current?.start(); }, []);

  const value = useMemo<HospitalStoreValue>(() => ({
    hospital, profileStatus, setHospital: (h: any) => { setHospital(h); setHospitalId(String(h?.id ?? "")); setProfileStatus("ready"); },
    hospitalId, setHospitalId, refreshHospital, handlesEmergencies, setHandlesEmergencies,
    socketStatus, reconnectSocket, revision, emergencyQueue, refreshEmergencies, removeEmergency,
  }), [hospital, profileStatus, hospitalId, refreshHospital, handlesEmergencies, setHandlesEmergencies, socketStatus,
    reconnectSocket, revision, emergencyQueue, refreshEmergencies, removeEmergency]);

  return <HospitalStore.Provider value={value}>{children}</HospitalStore.Provider>;
}

export function useHospitalStore() {
  const value = useContext(HospitalStore);
  if (!value) throw new Error("useHospitalStore must be used inside HospitalProvider");
  return value;
}
