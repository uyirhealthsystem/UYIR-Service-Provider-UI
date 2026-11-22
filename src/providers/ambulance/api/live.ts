import { getAccessToken } from "../../../auth/session";
import { BASE_URL } from "../config/env";
import { buildFrame, parseFrames, type StompFrame } from "../domain/stomp";

const SOCKET_URL = `${BASE_URL.replace(/^http/, "ws")}/api/v1/ambulance/ws`;
const HEARTBEAT_MS = 10000;
// Two missed server heartbeats, plus some room for a slow network.
const SILENCE_LIMIT_MS = 25000;
const MAX_RETRY_MS = 30000;

const OFFERS_SUBSCRIPTION = "offers";
const TRIP_SUBSCRIPTION = "trip";

export type LiveEvent = { kind: "offer" } | { kind: "tripStatus"; status: string };

function toEvent(frame: StompFrame): LiveEvent | null {
  const subscription = frame.headers.subscription;
  if (subscription === OFFERS_SUBSCRIPTION) return { kind: "offer" };
  if (subscription !== TRIP_SUBSCRIPTION) return null;

  // The trip topic also carries this ambulance's own location updates.
  try {
    const message = JSON.parse(frame.body);
    return message?.event === "status" ? { kind: "tripStatus", status: message.status } : null;
  } catch {
    return null;
  }
}

/**
 * Keeps a live connection for new offers and, during a trip, its status changes.
 * Reconnects by itself. Returns a function that closes the connection.
 */
export function connectDriverLive(tripId: string | null, onEvent: (event: LiveEvent) => void) {
  let closed = false;
  let attempts = 0;
  let socket: WebSocket | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;

  function stopHeartbeat() {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
  }

  function scheduleRetry() {
    if (closed) return;
    const delay = Math.min(1000 * 2 ** attempts, MAX_RETRY_MS);
    attempts += 1;
    retry = setTimeout(open, delay);
  }

  function open() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      scheduleRetry();
      return;
    }

    const connection = new WebSocket(SOCKET_URL, ["v12.stomp"]);
    socket = connection;
    let lastHeard = Date.now();

    connection.onopen = () => {
      connection.send(
        buildFrame("CONNECT", {
          "accept-version": "1.2",
          host: BASE_URL.replace(/^https?:\/\//, ""),
          "heart-beat": `${HEARTBEAT_MS},${HEARTBEAT_MS}`,
          Authorization: `Bearer ${accessToken}`,
        }),
      );
    };

    connection.onmessage = ({ data }) => {
      lastHeard = Date.now();
      if (typeof data !== "string") return;

      for (const frame of parseFrames(data)) {
        if (frame.command === "CONNECTED") {
          attempts = 0;
          connection.send(
            buildFrame("SUBSCRIBE", {
              id: OFFERS_SUBSCRIPTION,
              destination: "/user/queue/offers",
            }),
          );
          if (tripId) {
            connection.send(
              buildFrame("SUBSCRIBE", {
                id: TRIP_SUBSCRIPTION,
                destination: `/topic/booking/${tripId}`,
              }),
            );
          }
          stopHeartbeat();
          heartbeat = setInterval(() => {
            if (Date.now() - lastHeard > SILENCE_LIMIT_MS) connection.close();
            else connection.send("\n");
          }, HEARTBEAT_MS);
        } else if (frame.command === "MESSAGE") {
          const event = toEvent(frame);
          if (event) onEvent(event);
        } else if (frame.command === "ERROR") {
          connection.close();
        }
      }
    };

    connection.onerror = () => connection.close();
    connection.onclose = () => {
      stopHeartbeat();
      scheduleRetry();
    };
  }

  open();

  return () => {
    closed = true;
    stopHeartbeat();
    if (retry) clearTimeout(retry);
    socket?.close();
  };
}
