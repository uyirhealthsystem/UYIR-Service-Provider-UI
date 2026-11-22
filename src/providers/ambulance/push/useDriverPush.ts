import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";

import { onLogout } from "../../../auth/session";
import { registerDevice, unregisterDevice } from "../api/devices";
import { ensureOfferChannel } from "./offerPush";

/**
 * Registers this phone for booking offers once the driver has a profile (the server answers 404 before that), and
 * removes it on logout so the phone stops ringing for this driver.
 *
 * Android only: iOS returns an APNs token, which the server cannot use until Firebase is set up for iOS.
 */
export function useDriverPush(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS !== "android") return;

    let cancelled = false;
    let token: string | null = null;

    const register = async (next: string) => {
      token = next;
      await registerDevice(next).catch((e) => console.log("Device registration failed:", e));
    };

    (async () => {
      // Android only shows the permission prompt after a channel exists.
      await ensureOfferChannel();
      const { granted } = await Notifications.requestPermissionsAsync();
      if (cancelled) return;
      if (!granted) {
        Alert.alert(
          "Turn on notifications",
          "You will not hear new bookings while the app is closed unless notifications are allowed.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Open settings", onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
      const device = await Notifications.getDevicePushTokenAsync();
      if (!cancelled) await register(String(device.data));
    })().catch((e) => console.log("Push setup failed:", e));

    const tokenChanges = Notifications.addPushTokenListener((device) => {
      void register(String(device.data));
    });

    const offLogout = onLogout(() => {
      if (token) void unregisterDevice(token).catch((e) => console.log("Device removal failed:", e));
      void Notifications.dismissAllNotificationsAsync().catch(() => {});
    });

    return () => {
      cancelled = true;
      tokenChanges.remove();
      offLogout();
    };
  }, [enabled]);
}
