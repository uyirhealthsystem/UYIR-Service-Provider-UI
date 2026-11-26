import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { CollectorBooking, CollectorStatus } from "../provider-data/data";
import * as collectorApi from "../../api/collector";
import * as Location from "expo-location";

type CollectorStore = {
  requests: CollectorBooking[];
  activeBooking: CollectorBooking | null;
  history: CollectorBooking[];
  profile: collectorApi.CollectorProfile | null;
  dashboard: any;
  earnings: any;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  acceptBooking: (id: string) => Promise<CollectorBooking>;
  rejectBooking: (id: string) => Promise<void>;
  setStatus: (status: CollectorStatus) => void;
  verifyPatientOtp: (bookingId: string, otp: string) => Promise<void>;
  createCollectionSamples: (bookingId: string) => Promise<void>;
  uploadCollectionImage: (uri: string) => Promise<void>;
  markSampleCollected: (sampleId: string) => Promise<void>;
  markSampleInTransit: (sampleId: string) => Promise<void>;
  uploadDeliveryProof: (uri: string) => Promise<void>;
  verifyHandoverOtp: (sampleId: string, otp: string) => Promise<void>;
  updatePersonalProfile: (payload: { name?: string; phone?: string; qualification?: string; qualificationNumber?: string; qualificationProofUrl?: string }) => Promise<void>;
  setAvailability: (isAvailable: boolean) => Promise<void>;
};

const Context = createContext<CollectorStore | null>(null);

export function LabSampleCollectorProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<CollectorBooking[]>([]);
  const [activeBooking, setActiveBooking] = useState<CollectorBooking | null>(null);
  const [history, setHistory] = useState<CollectorBooking[]>([]);
  const [profile, setProfile] = useState<collectorApi.CollectorProfile | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizeBooking = useCallback((assignmentOrOffer: any): CollectorBooking => {
    const assignment = assignmentOrOffer.assignment || assignmentOrOffer;
    const offer = assignmentOrOffer.offer;
    const home = assignment.homeCollection || offer?.homeCollection || assignmentOrOffer.homeCollection;
    const appointment = home?.appointment || {};
    const patient = appointment.patient || {};
    const report = appointment.report || appointment.tests?.find((item: any) => item.report)?.report;
    const tests = (appointment.tests || home?.samples || []).map((item: any) => ({
      name: item.testCatalog?.name || item.labTest?.testCatalog?.name || item.name || item.appointmentTest?.labTest?.testCatalog?.name || "Laboratory test",
      type: item.testCatalog?.sampleType || item.labTest?.testCatalog?.sampleType || item.sampleType || "Sample",
      collected: item.status ? item.status !== "PENDING_COLLECTION" : Boolean(item.collected),
      sampleId: item.sampleId,
      appointmentTestId: item.appointmentTestId,
    }));
    const assignmentStatus = String(assignment.status || "ASSIGNED").toUpperCase();
    const status: CollectorStatus =
      assignmentStatus === "REJECTED" || assignmentStatus === "CANCELLED" ? "NEW" :
      assignmentStatus === "COMPLETED" ? "COMPLETED" :
      String(home?.status || "").toUpperCase() === "SAMPLE_COLLECTED" ? "COLLECTED" :
      String(home?.status || "").toUpperCase() === "ASSIGNED" ? "ACCEPTED" : "ACCEPTED";
    return {
      id: String(home?.homeCollectionId || assignment.collectorAssignmentId || offer?.offerId || assignmentOrOffer.offerId || ""),
      offerId: String(offer?.offerId || assignmentOrOffer.offerId || ""),
      homeCollectionId: String(home?.homeCollectionId || ""),
      labId: String(appointment.labId || appointment.lab?.labId || ""),
      patient: String(patient.name || appointment.patientName || "Patient"),
      age: Number(patient.age || appointment.patient?.age || 0),
      gender: String(patient.gender || appointment.patient?.gender || ""),
      phone: String(patient.phone || appointment.patient?.phone || ""),
      date: String(appointment.appointmentDate || ""),
      time: String(appointment.startTime || ""),
      address: String(home?.address || appointment.address || ""),
      distance: offer?.distanceKm != null ? `${offer.distanceKm} km` : "",
      tests,
      notes: String(home?.specialInstructions || appointment.patientNotes || ""),
      amount: 0,
      otp: "",
      labName: String(appointment.lab?.name || "Assigned laboratory"),
      labAddress: String(appointment.lab?.address || ""),
      status,
      reportStatus: String(report?.status || appointment.reportStatus || ""),
      reportUrl: String(report?.reportUrl || report?.fileUrl || appointment.reportUrl || ""),
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await collectorApi.getMyCollectorProfile();
      setProfile(me);

      if (me.status !== "ACTIVE" || me.qualificationStatus !== "VERIFIED") {
        setDashboard(null);
        setEarnings(null);
        setRequests([]);
        setActiveBooking(null);
        setHistory([]);
        return;
      }

      const [dashboardResult, bookingsResult, historyResult, earningsResult] = await Promise.all([
        collectorApi.getMyCollectorDashboard(),
        collectorApi.getMyCollectorBookings(),
        collectorApi.getMyCollectorHistory(),
        collectorApi.getMyCollectorEarnings().catch(() => null),
      ]);
      setDashboard(dashboardResult);
      setEarnings(earningsResult);
      const assignments = Array.isArray(bookingsResult?.assignments) ? bookingsResult.assignments : [];
      const offers = Array.isArray(bookingsResult?.offers) ? bookingsResult.offers : [];
      setRequests([
        ...offers.map((offer: any) => normalizeBooking({ offer, homeCollection: offer.homeCollection })),
        ...assignments.map(normalizeBooking),
      ]);
      const active = assignments.find((item: any) => ["ASSIGNED", "ACCEPTED"].includes(String(item.status).toUpperCase()));
      setActiveBooking(active ? normalizeBooking(active) : null);
      setHistory((Array.isArray(historyResult?.assignments) ? historyResult.assignments : []).map(normalizeBooking));
    } catch (e: any) {
      setError(e?.message || "Unable to load collector data.");
    } finally {
      setLoading(false);
    }
  }, [normalizeBooking]);

  useEffect(() => { refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const acceptBooking = async (id: string) => {
    const found = requests.find((item) => item.id === id);
    if (!found?.offerId) throw new Error("Lab assignments must be accepted from the laboratory workflow.");
    const assignment = await collectorApi.acceptCollectorOffer(found.offerId);
    const accepted = normalizeBooking(assignment);
    setRequests((items) => items.filter((item) => item.id !== id));
    setActiveBooking(accepted);
    return accepted;
  };

  const rejectBooking = async (id: string) => {
    const found = requests.find((item) => item.id === id);
    if (!found?.offerId) throw new Error("Only independent collector offers can be rejected here.");
    await collectorApi.rejectCollectorOffer(found.offerId);
    setRequests((items) => items.filter((item) => item.id !== id));
  };
  const setStatus = (status: CollectorStatus) => setActiveBooking(b => b ? { ...b, status } : b);
  const verifyPatientOtp = async (bookingId: string, otp: string) => {
    await collectorApi.verifyHomeCollectionOtp(bookingId, otp);
  };
  const createCollectionSamples = async (bookingId: string) => {
    if (!activeBooking) throw new Error("No active collection.");
    for (const test of activeBooking.tests) {
      if (test.appointmentTestId && !test.sampleId) {
        const sample = await collectorApi.createSample({
          appointmentTestId: test.appointmentTestId,
          homeCollectionId: bookingId,
          barcode: `UYIR-${Date.now()}-${test.appointmentTestId.slice(0, 8)}`,
          sampleType: test.type,
        });
        test.sampleId = String(sample?.sampleId || "");
      }
    }
  };
  const uploadCollectionImage = async (uri: string) => {
    if (!activeBooking) throw new Error("No active collection.");
    for (const test of activeBooking.tests) {
      if (test.sampleId) await collectorApi.uploadCollectorEvidence(test.sampleId, uri, "COLLECTION_PHOTO");
    }
  };
  const markSampleCollected = async (sampleId: string) => {
    await collectorApi.updateCollectorSampleStatus(sampleId, "COLLECTED");
  };
  const markSampleInTransit = async (sampleId: string) => {
    await collectorApi.updateCollectorSampleStatus(sampleId, "IN_TRANSIT");
  };
  const uploadDeliveryProof = async (uri: string) => {
    if (!activeBooking) throw new Error("No active collection.");
    for (const test of activeBooking.tests) {
      if (test.sampleId) await collectorApi.uploadCollectorEvidence(test.sampleId, uri, "DELIVERY_PROOF");
    }
  };
  const verifyHandoverOtp = async (sampleId: string, otp: string) => {
    await collectorApi.verifySampleHandoverOtp(sampleId, otp);
  };
  const updatePersonalProfile = async (payload: { name?: string; phone?: string; qualification?: string; qualificationNumber?: string; qualificationProofUrl?: string }) => {
    const updated = await collectorApi.updateCollectorProfile(payload);
    setProfile((current) => current ? { ...current, ...updated } : updated);
  };

  const setAvailability = async (isAvailable: boolean) => {
    if (isAvailable) {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("Location permission is required.");
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await collectorApi.updateCollectorLocation(position.coords.latitude, position.coords.longitude, true);
    } else {
      if (profile?.latitude == null || profile?.longitude == null) throw new Error("No location is available to preserve.");
      await collectorApi.updateCollectorLocation(profile.latitude, profile.longitude, false);
    }
    await refresh();
  };

  const value = useMemo(() => ({
    requests, activeBooking, history, profile, dashboard, earnings, loading, error, refresh,
    acceptBooking, rejectBooking, setStatus, verifyPatientOtp, createCollectionSamples, uploadCollectionImage,
    markSampleCollected, markSampleInTransit, uploadDeliveryProof, verifyHandoverOtp, updatePersonalProfile, setAvailability,
  }), [requests, activeBooking, history, profile, dashboard, earnings, loading, error, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLabSampleCollector() {
  const value = useContext(Context);
  if (!value) throw new Error("useLabSampleCollector must be used inside LabSampleCollectorProvider");
  return value;
}
