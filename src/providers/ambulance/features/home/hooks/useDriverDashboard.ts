import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";

import {
  acceptBooking,
  arrivedAtPickup,
  dropPatient,
  getCurrentBooking,
  getOpenOffers,
  pickupPatient,
  rejectBooking,
} from "../../../api/bookings";
import { errorMessage, isStaleTripError } from "../../../api/errors";
import { connectDriverLive } from "../../../api/live";
import { getMyProfile } from "../../../api/profile";
import { updateDriverStatus } from "../../../api/status";
import { isDriverOnline, OTP_LENGTH, tripPhase } from "../../../domain/trip";
import { clearExpiredOfferAlarms, onOfferPush, stopOfferAlarm } from "../../../push/offerPush";
import { useDriverPush } from "../../../push/useDriverPush";
import type { Booking, DriverProfile, Offer } from "../../../types";
import { getCurrentCoordinate } from "./useDriverLocation";

// A backup for when the live connection and push notifications are both unavailable.
const REFRESH_MS = 15000;

const isDropped = (trip: Booking | null) =>
  trip !== null && tripPhase(trip.status) === "DROPPED";

export function useDriverDashboard() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [online, setOnline] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [trip, setTripState] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);

  const tripRef = useRef<Booking | null>(null);
  // Results of a refresh that overlapped a driver action are out of date.
  const refreshId = useRef(0);

  const setTrip = useCallback((next: Booking | null) => {
    tripRef.current = next;
    setTripState(next);
  }, []);

  const load = useCallback(async () => {
    refreshId.current += 1;
    const id = refreshId.current;

    const [profileResult, currentResult] = await Promise.allSettled([
      getMyProfile(),
      getCurrentBooking(),
    ]);
    if (id !== refreshId.current) return;

    const driver = profileResult.status === "fulfilled" ? profileResult.value : null;
    const isOnline = isDriverOnline(driver?.status);
    if (driver) {
      setProfile(driver);
      setOnline(isOnline);
    }

    // Keep the trip on screen if the server could not be reached.
    if (currentResult.status === "rejected") return;

    const current = currentResult.value;
    const previous = tripRef.current;

    // A dropped trip is no longer current, but stays on screen until the driver taps Done.
    if (!current && isDropped(previous)) return;

    if (!current && previous) {
      Alert.alert("Trip ended", "This trip was cancelled or is no longer assigned to you.");
    }
    setTrip(current);

    if (current || !isOnline) {
      setOffer(null);
      return;
    }

    const offers = await getOpenOffers().catch(() => null);
    if (offers && id === refreshId.current) setOffer(offers[0] ?? null);
  }, [setTrip]);

  useEffect(() => {
    void load();
  }, [load]);

  useDriverPush(profile !== null);

  // A push can arrive late or twice, so the server's list of open offers decides what is shown.
  useEffect(() => {
    const offPush = onOfferPush(() => void load());
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void clearExpiredOfferAlarms();
      void load();
    });
    return () => {
      offPush();
      appState.remove();
    };
  }, [load]);

  const liveTripId = trip && !isDropped(trip) ? trip.id : null;
  const listening = profile !== null && (online || liveTripId !== null);

  useEffect(() => {
    if (!listening) return;

    const disconnect = connectDriverLive(liveTripId, () => void load());
    const refresh = setInterval(() => {
      if (AppState.currentState === "active") void load();
    }, REFRESH_MS);

    return () => {
      disconnect();
      clearInterval(refresh);
    };
  }, [listening, liveTripId, load]);

  async function run(failureTitle: string, action: () => Promise<void>) {
    try {
      setLoading(true);
      refreshId.current += 1;
      await action();
      refreshId.current += 1;
    } catch (error) {
      Alert.alert(failureTitle, errorMessage(error));
      if (isStaleTripError(error)) await load();
    } finally {
      setLoading(false);
    }
  }

  const changeAvailability = (value: boolean) =>
    run("Unable to change availability", async () => {
      if (!value) {
        await updateDriverStatus({ online: false });
        setOnline(false);
        setOffer(null);
        return;
      }

      const position = await getCurrentCoordinate();
      if (!position) {
        Alert.alert("Location required", "Allow location access before going online.");
        return;
      }

      await updateDriverStatus({
        online: true,
        lat: position.latitude,
        lng: position.longitude,
      });
      setOnline(true);
      const offers = await getOpenOffers().catch(() => []);
      setOffer(offers[0] ?? null);
    });

  const acceptOffer = () =>
    run("Unable to accept booking", async () => {
      if (!offer) return;
      void stopOfferAlarm(offer.bookingId);
      setTrip(await acceptBooking(offer.bookingId));
      setOffer(null);
    });

  const rejectOffer = () =>
    run("Unable to decline booking", async () => {
      if (!offer) return;
      void stopOfferAlarm(offer.bookingId);
      await rejectBooking(offer.bookingId);
      setOffer(null);
    });

  const expireOffer = () => {
    if (offer) void stopOfferAlarm(offer.bookingId);
    setOffer(null);
    void load();
  };

  const markArrived = () =>
    run("Unable to update arrival", async () => {
      if (trip) setTrip(await arrivedAtPickup(trip.id));
    });

  const confirmPickup = (otp: string) => {
    if (otp.length !== OTP_LENGTH) {
      Alert.alert("OTP required", `Enter the ${OTP_LENGTH}-digit OTP from the patient.`);
      return;
    }
    return run("OTP verification failed", async () => {
      if (trip) setTrip(await pickupPatient(trip.id, otp));
    });
  };

  const markDropped = () =>
    run("Unable to complete drop-off", async () => {
      // The server recalculates the final fare at drop-off.
      if (trip) setTrip(await dropPatient(trip.id));
    });

  const finishTrip = () => {
    setTrip(null);
    void load();
  };

  return {
    profile,
    online,
    offer,
    trip,
    loading,
    changeAvailability,
    acceptOffer,
    rejectOffer,
    expireOffer,
    markArrived,
    confirmPickup,
    markDropped,
    finishTrip,
  };
}
