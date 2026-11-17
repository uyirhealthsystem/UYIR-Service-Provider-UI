/**
 * Live booking updates — WebSocket client (backend guide: "Live Booking Updates").
 *
 * Read-only: the server only tells us *something changed*; REST stays the source of truth.
 * Rules implemented from the guide:
 *  1. Reconnect after a random 1–5 s, exponential backoff up to 30 s (server deploys close with 1001).
 *  2. Every (re)connect → `onResync` so screens refetch (missed messages are never replayed).
 *  3. Messages are hints; screens refetch from REST.
 *  4. One connection per app (owned by the provider, not per screen).
 *  5. Closed on background / reopened on foreground (AppState handled by the provider).
 *  6. React Native can't see server pings → we send PING every 25 s.
 *  7. 403 / 1008 → don't retry in a loop.
 */
import { getRefreshToken, isAccessTokenExpired, refreshAccessToken } from "../../../auth/session";
import { HOSPITAL_WS_URL } from "../config/env";

export type SocketStatus = "idle" | "connecting" | "open" | "reconnecting" | "blocked" | "failed";

export type BookingEvent = {
  type: string;
  bookingType?: "EMERGENCY" | "APPOINTMENT";
  bookingId?: string;
  hospitalId?: string;
  patientId?: string;
  patientName?: string;
  doctorId?: string | null;
  appointmentDateTime?: string | null;
  tokenNumber?: number | null;
  emergencyType?: string | null;
  status?: string;
  changedBy?: "PATIENT" | "HOSPITAL";
  occurredAt?: string;
};

type Auth = { token: string; userId: string; role: string };
type Handlers = {
  onStatus: (s: SocketStatus) => void;
  onEvent: (e: BookingEvent) => void;
  onResync: () => void;
};

const PING_MS = 25_000;
const MAX_HANDSHAKE_FAILURES = 5;

export class HospitalSocket {
  private ws: any = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private retry = 0;
  private handshakeFailures = 0;
  private stopped = true;

  constructor(private getAuth: () => Auth, private handlers: Handlers, private url: string = HOSPITAL_WS_URL) {}

  /** Open (or re-open) the connection. Safe to call repeatedly. */
  start() {
    this.stopped = false;
    this.retry = 0;
    this.handshakeFailures = 0;
    this.clearTimers();
    this.open();
  }

  /** Close for good (screen unmount / app backgrounded / logout). */
  stop() {
    this.stopped = true;
    this.clearTimers();
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
      try { ws.close(1000); } catch { /* already closed */ }
    }
    this.handlers.onStatus("idle");
  }

  private clearTimers() {
    if (this.timer) clearTimeout(this.timer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.timer = null;
    this.pingTimer = null;
  }

  private open() {
    if (this.stopped || (this.ws && this.ws.readyState <= 1)) return;
    const { token, userId, role } = this.getAuth();
    if (!token && !userId) {
      this.handlers.onStatus("failed");
      return;
    }
    this.handlers.onStatus(this.retry === 0 && this.handshakeFailures === 0 ? "connecting" : "reconnecting");

    // Mobile apps authenticate with the Authorization header. X-User-* are what the service
    // trusts when it is called directly (local dev); the gateway overwrites them in production.
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { "X-User-Id": userId } : {}),
      "X-User-Role": role,
    };

    let opened = false;
    let ws: any;
    try {
      ws = new (WebSocket as any)(this.url, null, { headers });
    } catch {
      this.scheduleReconnect(false);
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      opened = true;
      this.retry = 0;
      this.handshakeFailures = 0;
      this.handlers.onStatus("open");
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => {
        try { ws.send("PING"); } catch { /* connection is closing */ }
      }, PING_MS);
    };

    ws.onmessage = (e: { data: unknown }) => {
      let msg: BookingEvent | null = null;
      try { msg = JSON.parse(String(e.data)); } catch { return; }
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "PONG") return;
      if (msg.type === "CONNECTED") { this.handlers.onResync(); return; }
      this.handlers.onEvent(msg); // unknown types are ignored by listeners
    };

    ws.onerror = () => { /* onclose always follows */ };

    ws.onclose = (e: { code?: number }) => {
      if (this.ws === ws) this.ws = null;
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.pingTimer = null;
      if (this.stopped) return;
      const code = e?.code;
      if (code === 1008) { this.handlers.onStatus("blocked"); return; } // not allowed / too many connections
      if (code === 1000) { this.handlers.onStatus("idle"); return; }    // normal close
      this.scheduleReconnect(opened);                                    // 1001 / 4500 / network drop
    };
  }

  private scheduleReconnect(wasOpen: boolean) {
    if (this.stopped) return;
    if (!wasOpen) {
      // Never got in: most likely 403 (expired token / wrong role). Don't loop forever.
      this.handshakeFailures += 1;
      if (this.handshakeFailures >= MAX_HANDSHAKE_FAILURES) {
        this.handlers.onStatus("failed");
        return;
      }
    }
    const delay = Math.min(30_000, 1000 * 2 ** this.retry + Math.random() * 4000);
    this.retry += 1;
    this.handlers.onStatus("reconnecting");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      // An expired access token makes the handshake fail: refresh it before trying again.
      if (isAccessTokenExpired() && getRefreshToken()) {
        try {
          await refreshAccessToken();
        } catch {
          // Refresh failed (offline or session over); open() reports the failure.
        }
      }
      this.open();
    }, delay);
  }
}
