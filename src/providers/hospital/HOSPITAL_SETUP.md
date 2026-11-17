# Hospital provider – setup notes

## Optional install (emergency siren)
The emergency popup always vibrates. For the looping siren install ONE of:

    npx expo install expo-audio      # newer Expo SDKs
    npx expo install expo-av         # older Expo SDKs

The sound file is `assets/emergency-alarm.wav` (replace it with your own if you like).

## Environment
| Variable | Purpose | Default |
|---|---|---|
| `EXPO_PUBLIC_HOSPITAL_API_URL` | REST base URL | `http://13.201.204.85:8078` |
| `EXPO_PUBLIC_HOSPITAL_WS_URL`  | WebSocket URL (`wss://<gateway-host>/api/v1/hospital/ws` in prod) | REST host with `ws://` + `/api/v1/hospital/ws` |

## Live updates (WebSocket) – `realtime/socketClient.ts`, wired in `features/provider-state/store.tsx`
- One connection per app, header auth (`Authorization: Bearer <token>`; `X-User-Id` / `X-User-Role` are also sent for direct/local calls).
- Reconnect: random 1–5 s, exponential back-off up to 30 s. Close codes: 1001/4500 reconnect, 1008 stop, 1000 nothing.
- After every (re)connect (`CONNECTED` message) everything is refetched from REST. Messages are only hints.
- Closed when the app goes to background, reopened on foreground. `PING` every 25 s.
- If it never connects (e.g. 403) it stops after 5 tries and the "Live" chip turns into "Tap to retry" (no retry loop).
- While the socket is down, emergency requests are polled every 15 s so none is missed.

## Screens
Tabs: Home · Appointments · Doctors · Emergency.
Stack: Doctor form, Seats & payment (`HospitalAssign`), Token limits (`HospitalSlots`), Doctor schedule,
Doctor patients, Appointment detail (complete / reschedule / cancel / no-show / follow-up / visit record), Mark complete.
