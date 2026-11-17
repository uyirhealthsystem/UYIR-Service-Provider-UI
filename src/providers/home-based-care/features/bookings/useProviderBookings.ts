import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { acceptBooking, getMyBookings, getPool } from "../../api/bookings";
import { HbcApiError, errorMessage } from "../../api/client";
import type { Booking } from "../../api/types";

export type PoolBlock = "" | "PROVIDER_LOCATION_REQUIRED" | "PROVIDER_PROFILE_REQUIRED";

// Loads the open pool and my assigned bookings together; reloads on focus.
export function useProviderBookings(enabled: boolean) {
  const [pool, setPool] = useState<Booking[]>([]);
  const [mine, setMine] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [poolBlock, setPoolBlock] = useState<PoolBlock>("");
  const [acceptingId, setAcceptingId] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError("");
    const [poolRes, mineRes] = await Promise.allSettled([getPool(), getMyBookings()]);

    if (poolRes.status === "fulfilled") {
      setPool(poolRes.value || []);
      setPoolBlock("");
    } else {
      const e = poolRes.reason;
      setPool([]);
      if (e instanceof HbcApiError && (e.code === "PROVIDER_LOCATION_REQUIRED" || e.code === "PROVIDER_PROFILE_REQUIRED")) {
        setPoolBlock(e.code);
      } else {
        setError(errorMessage(e, "Unable to load the booking pool."));
      }
    }

    if (mineRes.status === "fulfilled") setMine(mineRes.value || []);
    else setError((prev) => prev || errorMessage(mineRes.reason, "Unable to load your bookings."));

    setLoading(false);
  }, [enabled]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Returns the accepted booking, or null if it failed (alert already shown).
  const accept = useCallback(async (booking: Booking) => {
    setAcceptingId(booking.id);
    try {
      const accepted = await acceptBooking(booking.id);
      reload();
      return accepted;
    } catch (e) {
      if (e instanceof HbcApiError && e.code === "BOOKING_UNAVAILABLE") {
        Alert.alert("Booking taken", "Another provider picked this booking first.");
      } else if (e instanceof HbcApiError && e.status === 404) {
        Alert.alert("Not available", "This booking is no longer in your service area.");
      } else {
        Alert.alert("Could not accept", errorMessage(e));
      }
      reload();
      return null;
    } finally {
      setAcceptingId("");
    }
  }, [reload]);

  return { pool, mine, loading, error, poolBlock, reload, accept, acceptingId };
}
