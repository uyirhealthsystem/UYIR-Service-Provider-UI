import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { sendDriverLocation } from "../../../api/status";
import { validHeading } from "../../../domain/trip";
import type { Coordinate, DriverLocationRequest } from "../../../types";

// The server stops offering bookings to drivers silent for 60 seconds,
// and the position watcher stays quiet while the ambulance is parked.
const HEARTBEAT_MS = 20000;

async function hasLocationPermission() {
  const permission = await Location.requestForegroundPermissionsAsync();
  return permission.status === "granted";
}

function toCoordinate(location: Location.LocationObject): Coordinate {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/** Returns null when location permission is denied. */
export async function getCurrentCoordinate(): Promise<Coordinate | null> {
  if (!(await hasLocationPermission())) return null;
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return toCoordinate(position);
}

function pingServer(ping: DriverLocationRequest) {
  // A missed ping is replaced by the next one a few seconds later.
  sendDriverLocation(ping).catch(() => undefined);
}

/** Shows the driver's position, and reports it to the server while `tracking`. */
export function useDriverLocation(tracking: boolean) {
  const [location, setLocation] = useState<Coordinate | null>(null);

  const refreshLocation = useCallback(async () => {
    try {
      const current = await getCurrentCoordinate();
      if (current) setLocation(current);
    } catch {
      // The map stays on its last known position.
    }
  }, []);

  useEffect(() => {
    if (!tracking) {
      void refreshLocation();
      return;
    }

    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let lastPing: DriverLocationRequest | null = null;

    const report = (position: Location.LocationObject) => {
      if (!active) return;
      const current = toCoordinate(position);
      setLocation(current);
      lastPing = {
        lat: current.latitude,
        lng: current.longitude,
        heading: validHeading(position.coords.heading),
      };
      pingServer(lastPing);
    };

    async function start() {
      if (!(await hasLocationPermission())) {
        Alert.alert(
          "Location Required",
          "Allow location access to use the live trip map.",
        );
        return;
      }

      report(
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
      );

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        report,
      );

      if (!active) {
        watcher.remove();
        return;
      }

      subscription = watcher;
      heartbeat = setInterval(() => {
        if (lastPing) pingServer(lastPing);
      }, HEARTBEAT_MS);
    }

    start().catch(() => undefined);

    return () => {
      active = false;
      subscription?.remove();
      if (heartbeat) clearInterval(heartbeat);
    };
  }, [tracking, refreshLocation]);

  return { location, refreshLocation };
}
