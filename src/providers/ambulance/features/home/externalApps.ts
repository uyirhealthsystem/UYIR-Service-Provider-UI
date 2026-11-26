import { Alert, Linking } from "react-native";

import type { Coordinate } from "../../types";

/** Opens turn-by-turn directions from the ambulance's current position. */
export function openNavigation({ latitude, longitude }: Coordinate) {
  const url =
    "https://www.google.com/maps/dir/?api=1" +
    `&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`;
  Linking.openURL(url).catch(() =>
    Alert.alert("Unable to open maps", "Install Google Maps or follow the route on this screen."),
  );
}

/** Opens a map search for hospitals around the ambulance, for trips booked without one. */
export function openNearbyHospitals() {
  Linking.openURL("https://www.google.com/maps/search/?api=1&query=hospital").catch(() =>
    Alert.alert("Unable to open maps", "Install Google Maps to search for a hospital."),
  );
}

export function callPhone(phone: string) {
  Linking.openURL(`tel:${phone}`).catch(() =>
    Alert.alert("Unable to place call", `Call ${phone} from your phone app.`),
  );
}
