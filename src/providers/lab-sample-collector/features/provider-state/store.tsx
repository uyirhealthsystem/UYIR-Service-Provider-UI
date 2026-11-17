import React, { createContext, useContext, useMemo, useState } from "react";
import { collectorBookings, CollectorBooking, CollectorStatus } from "../provider-data/data";

type CollectorStore = {
  requests: CollectorBooking[];
  activeBooking: CollectorBooking | null;
  history: CollectorBooking[];
  acceptBooking: (id: string) => CollectorBooking | null;
  rejectBooking: (id: string) => void;
  setStatus: (status: CollectorStatus) => void;
  uploadCollectionImage: () => void;
  confirmDelivery: () => void;
};

const Context = createContext<CollectorStore | null>(null);

export function LabSampleCollectorProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<CollectorBooking[]>(collectorBookings);
  const [activeBooking, setActiveBooking] = useState<CollectorBooking | null>(null);
  const [history, setHistory] = useState<CollectorBooking[]>([]);

  const acceptBooking = (id: string) => {
    if (activeBooking) return null; // collector can handle only one job at a time
    const found = requests.find(b => b.id === id);
    if (!found) return null;
    const accepted = { ...found, status: "ACCEPTED" as const };
    setRequests(items => items.filter(b => b.id !== id));
    setActiveBooking(accepted);
    return accepted;
  };

  const rejectBooking = (id: string) => setRequests(items => items.filter(b => b.id !== id));
  const setStatus = (status: CollectorStatus) => setActiveBooking(b => b ? { ...b, status } : b);
  const uploadCollectionImage = () => setActiveBooking(b => b ? { ...b, status: "COLLECTED", collectionImage: "sample-photo.jpg" } : b);
  const confirmDelivery = () => {
    setActiveBooking(b => {
      if (!b) return null;
      const completed = { ...b, status: "COMPLETED" as const, labConfirmed: true };
      setHistory(items => [completed, ...items]);
      return null;
    });
  };

  const value = useMemo(() => ({ requests, activeBooking, history, acceptBooking, rejectBooking, setStatus, uploadCollectionImage, confirmDelivery }), [requests, activeBooking, history]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLabSampleCollector() {
  const value = useContext(Context);
  if (!value) throw new Error("useLabSampleCollector must be used inside LabSampleCollectorProvider");
  return value;
}
