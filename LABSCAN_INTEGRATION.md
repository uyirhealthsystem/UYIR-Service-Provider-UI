# LabScan Collector Integration Contract

## API base

The collector and sample implementation uses:

`LAB_API_BASE_URL + /api/v1/labscan`

Requests include:

- `Authorization: Bearer <accessToken>`
- `x-user-id: <authenticated subject>`
- `x-user-role: LSC`

## Collector profile

### Create

`POST /api/v1/labscan/collector`

LAB payload:

```json
{
  "collectorType": "LAB",
  "labId": "<labId>",
  "name": "Collector name",
  "phone": "9876543210",
  "role": "TECHNICIAN",
  "qualification": "DMLT",
  "qualificationNumber": "DMLT-001",
  "qualificationProofUrl": "https://..."
}
```

INDEPENDENT payload:

```json
{
  "collectorType": "INDEPENDENT",
  "name": "Collector name",
  "phone": "9876543211",
  "role": "TECHNICIAN",
  "qualification": "DMLT",
  "qualificationNumber": "DMLT-002",
  "qualificationProofUrl": "https://..."
}
```

Do not send `labId` for an independent collector. Do not send frontend-assigned `status: ACTIVE` or `qualificationStatus: VERIFIED`; the backend defaults these fields and enforces separate approval checks.

### Profile and operational data

- `GET /collectors/me`
- `PATCH /collectors/me/location`
- `GET /collectors/me/dashboard`
- `GET /collectors/me/history`
- `GET /collectors/me/bookings`
- `GET /collectors/me/offers`

Location payload:

```json
{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "isAvailable": true
}
```

## Assignment models

LAB collectors are assigned directly by their laboratory:

- Active assignment statuses are `ASSIGNED`, `ACCEPTED`, `COMPLETED`, `REJECTED`, and `CANCELLED`.
- LAB direct assignment acceptance is disabled; the backend uses the laboratory assignment workflow.
- Independent collectors must accept or reject offers only.

Independent offer actions:

- `POST /collectors/me/offers/:offerId/accept`
- `POST /collectors/me/offers/:offerId/reject`

Independent acceptance requires:

- `collectorType === INDEPENDENT`
- `labId === null`
- active account
- verified qualification
- available status
- fresh GPS location
- patient location within the backend radius
- fewer than the backend active-booking limit

## Home collection workflow

The collector verifies the patient's home collection OTP:

`POST /collector/homecollection/:homeCollectionId/verify-otp`

```json
{
  "otp": "123456"
}
```

After verification, create each sample using:

`POST /sample`

```json
{
  "appointmentTestId": "<appointmentTestId>",
  "homeCollectionId": "<homeCollectionId>",
  "barcode": "<unique barcode>",
  "sampleType": "<test catalog sampleType>",
  "containerType": "<optional>",
  "notes": "<optional>"
}
```

Upload collection evidence:

`POST /collector/samples/:sampleId/evidence`

Multipart field:

- `file`: JPG or PNG, maximum 10 MB
- `type`: `COLLECTION_PHOTO`

Update collector sample status:

`PATCH /collector/samples/:sampleId/status`

The collector may set only:

- `COLLECTED`
- `IN_TRANSIT`

The frontend must not bypass collection-photo and verified-OTP requirements.

## Laboratory handover

The laboratory generates the OTP for a sample that is `IN_TRANSIT`:

`POST /sample/:sampleId/handover-otp/generate`

The collector verifies the OTP:

`POST /collector/samples/:sampleId/handover-otp/verify`

```json
{
  "otp": "123456"
}
```

The independent collector must use the laboratory associated with the booking; the frontend must not select a different laboratory for handover.

For delivery evidence:

`POST /collector/samples/:sampleId/evidence`

Multipart field:

- `file`: JPG or PNG, maximum 10 MB
- `type`: `DELIVERY_PROOF`

## Relevant sample statuses

`PENDING_COLLECTION -> COLLECTED -> IN_TRANSIT -> RECEIVED -> PROCESSING -> COMPLETED`

Terminal/exception states include `REJECTED`. Status transitions are enforced by the backend.

## Remaining implementation boundaries

- The app uses the backend as the source of truth for profile, qualification, account status, assignment, offer, OTP, sample and handover validation.
- The Citizen patient-side collection OTP generation endpoint is not implemented here because this repository is the provider application.
- The laboratory-side handover OTP generation and sample receiving UI remain in the Laboratory workflow and must use the matching appointment/lab identity.
- Real end-to-end testing requires valid LAB/INDEPENDENT accounts and backend test data.
