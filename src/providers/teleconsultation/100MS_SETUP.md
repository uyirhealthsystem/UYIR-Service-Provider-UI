# 100ms React Native integration

The latest Postman collection provides the doctor token endpoint:
`POST /appointments/{appointmentId}/session/join-token`.

The token response schema is not documented in the collection. The consultation screen currently requests this token and sequences the backend `start` and `end` actions, but the native 100ms media view must be connected after confirming the exact response fields.

Install the official native SDK from the project root:

```bash
npm install @100mslive/react-native-hms
```

Because this is a native React Native module, rebuild the Android application after installation (a Metro reload alone is not sufficient). Follow the official 100ms React Native integration guide for the installed SDK version and add camera/microphone permissions to the native app configuration.

Official docs:
- https://www.100ms.live/docs/react-native/v2/how-to-guides/install-the-sdk/integration
- https://www.100ms.live/docs/react-native/v2/how-to-guides/set-up-video-conferencing/join

Do not use the old LiveKit placeholder endpoint. The collection marks `/session/token` as planned; use the implemented `/session/join-token` endpoint instead.

The backend team must confirm the token response shape (for example, whether it returns `token`, `authToken`, room ID, room code, or other fields) before the native SDK join is wired.
