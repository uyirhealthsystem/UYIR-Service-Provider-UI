# Uyir Health Teleconsultation UI update

This update is scoped to `src/providers/teleconsultation/` only. Shared auth, ProviderRoutes, Hospital, PRO, Lab, Ambulance, HBC, ECG and other provider folders are not changed.

## Visual screens
- Dashboard with appointment summary and six quick-action tiles
- Appointments list and appointment details with confirm/reject/start/delay/end/complete actions
- Consultation room shell with session-token status
- Consultation notes draft and finalize
- Prescription draft, medicine entry and issue
- Monthly schedule, weekday-aligned calendar, future-date navigation, hide elapsed slots for today, create/update availability, active/inactive status
- Patient feedback list
- Complaints list and complaint submission form
- Doctor profile and earnings information

## API source
Endpoints are based on the latest Postman collection supplied on 2026-11-04. The app retains the configured base URL in `config/env.ts`; it does not use Postman's localhost URL.

## Backend limitations kept visible
- Doctor registration/status and doctor profile/consultation-fee APIs are not in this collection; profile and fee remain owned by Hospital service.
- Earnings/payout APIs are not in this collection; no fake amounts are displayed.
- Complaints are labelled Patient endpoints in the collection. The provider UI is present, but DOCTOR-role authorization must be confirmed by backend.
- Notifications endpoints and LiveKit token endpoint are marked planned placeholders and are not wired.
- The 100ms join token response is parsed from `data.token.token`, `data.roomId`, and `data.role`. Native 100ms video rendering still requires SDK/native integration and a native Android rebuild; the room screen is currently the consultation workflow shell, not a live video stream.
- No DELETE availability endpoint is included. Availability status can be toggled using the supplied PATCH status endpoint.
