import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

/**
 * Booking offers pushed by the ambulance service through FCM.
 *
 * The server sends data-only messages, so this code decides what the phone shows. The task below runs whether the
 * app is open, in the background or closed, which is why this file must be imported from index.js.
 */

const PUSH_TASK = "ambulance-offer-push";

/** Must match DriverPush.ALARM_CHANNEL on the server. Android never lets a channel's sound change after creation. */
const OFFER_CHANNEL = "driver_offers";
const OFFER_SOUND = "offer_alarm.wav";

type OfferPushEvent = { type: "OFFER" | "OFFER_CLOSED"; bookingId: string };
type OfferPushListener = (event: OfferPushEvent) => void;

const listeners = new Set<OfferPushListener>();

/** Tells the open app that an offer arrived or ended. Returns an unsubscribe function. */
export function onOfferPush(listener: OfferPushListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const notificationId = (bookingId: string) => `offer-${bookingId}`;

export async function ensureOfferChannel() {
  await Notifications.setNotificationChannelAsync(OFFER_CHANNEL, {
    name: "Booking offers",
    description: "Rings when a new ambulance booking is offered to you",
    importance: Notifications.AndroidImportance.MAX,
    sound: OFFER_SOUND,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    vibrationPattern: [0, 600, 300, 600, 300, 600],
    enableVibrate: true,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/** Stops the ringing for one offer. Safe to call when it is not showing. */
export async function stopOfferAlarm(bookingId: string) {
  await Notifications.dismissNotificationAsync(notificationId(bookingId)).catch(() => {});
}

/** Removes offers that ended while the app could not hear about it. */
export async function clearExpiredOfferAlarms() {
  const presented = await Notifications.getPresentedNotificationsAsync().catch(() => []);
  await Promise.all(
    presented
      .filter((item) => {
        const expiresAt = Date.parse(String(item.request.content.data?.expiresAt ?? ""));
        return Number.isFinite(expiresAt) && expiresAt <= Date.now();
      })
      .map((item) => Notifications.dismissNotificationAsync(item.request.identifier).catch(() => {})),
  );
}

async function ringForOffer(data: Record<string, unknown>, bookingId: string) {
  const expiresAt = Date.parse(String(data.expiresAt ?? ""));
  const timeLeft = expiresAt - Date.now();
  if (!Number.isFinite(timeLeft) || timeLeft <= 0) return; // delivered too late: the offer is already over

  await ensureOfferChannel();
  const distance = data.distanceKm ? `${data.distanceKm} km away. ` : "";
  await Notifications.scheduleNotificationAsync({
    identifier: notificationId(bookingId),
    content: {
      title: data.bookingType === "EMERGENCY" ? "New emergency booking" : "New booking",
      // Shown on the lock screen, so it leaves out the address and the medical reason.
      body: `${distance}Tap to respond.`,
      data: { type: "OFFER", bookingId, expiresAt: String(data.expiresAt) },
      sound: OFFER_SOUND,
      priority: Notifications.AndroidNotificationPriority.MAX,
      color: "#D92D20",
    },
    trigger: { channelId: OFFER_CHANNEL },
  });

  // Best effort: Android may stop a closed app before this runs. OFFER_CLOSED (EXPIRED) from the server is the backup.
  setTimeout(() => void stopOfferAlarm(bookingId), timeLeft);
}

async function handlePush(data: Record<string, unknown>) {
  const { type, bookingId } = data;
  if (typeof bookingId !== "string") return;

  if (type === "OFFER") {
    await ringForOffer(data, bookingId);
    listeners.forEach((listener) => listener({ type, bookingId }));
  } else if (type === "OFFER_CLOSED") {
    await stopOfferAlarm(bookingId);
    listeners.forEach((listener) => listener({ type, bookingId }));
  }
}

if (Platform.OS === "android") {
  // Rings while the app is open too, but the data-only FCM message itself is never shown.
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { data, title } = notification.request.content;
      const isOffer = data?.type === "OFFER" && Boolean(title); // the FCM message has no title, the alarm does
      return {
        shouldShowBanner: isOffer,
        shouldShowList: isOffer,
        shouldPlaySound: isOffer,
        shouldSetBadge: false,
      };
    },
  });

  TaskManager.defineTask<Notifications.NotificationTaskPayload>(PUSH_TASK, async ({ data, error }) => {
    if (error || !data || "actionIdentifier" in data) return;
    await handlePush(data.data ?? {}).catch((e) => console.log("Offer push failed:", e));
  });

  Notifications.registerTaskAsync(PUSH_TASK).catch((e) => console.log("Offer push task not registered:", e));
}
