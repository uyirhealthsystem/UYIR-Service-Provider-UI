import * as Location from "expo-location";
import { useState } from "react";

export type CurrentLocation = { latitude: number; longitude: number; postalCode?: string; city?: string };

export function useCurrentLocation() {
  const [locating, setLocating] = useState(false);

  const locate = async (): Promise<CurrentLocation> => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Location permission was denied. Enter your coordinates manually.");
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      let postalCode: string | undefined;
      let city: string | undefined;
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
        postalCode = address?.postalCode || undefined;
        city = address?.city || address?.subregion || undefined;
      } catch {
        // Reverse geocoding is a convenience only.
      }
      return { latitude: coords.latitude, longitude: coords.longitude, postalCode, city };
    } finally {
      setLocating(false);
    }
  };

  return { locate, locating };
}
