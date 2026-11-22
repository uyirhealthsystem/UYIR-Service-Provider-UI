type FieldError = { field: string; code: string; message: string };

/** Every server error is an RFC 7807 body: { status, title, detail, code, ...params }. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly fieldErrors: FieldError[];

  constructor(status: number, body: any) {
    super(body?.detail || body?.title || "Ambulance service request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = typeof body?.code === "string" ? body.code : null;
    this.fieldErrors = Array.isArray(body?.errors) ? body.errors : [];
  }
}

// The booking changed on the server (cancelled, expired, taken), so the screen is out of date.
const STALE_TRIP_CODES = new Set([
  "BOOKING_NOT_FOUND",
  "CONCURRENT_UPDATE",
  "DRIVER_NOT_AVAILABLE",
  "INVALID_BOOKING_STATUS",
  "NOT_YOUR_BOOKING",
  "OFFER_UNAVAILABLE",
]);

export function isStaleTripError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.code !== null &&
    STALE_TRIP_CODES.has(error.code)
  );
}

export function errorMessage(
  error: unknown,
  fallback = "Please try again.",
): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function tripHistoryErrorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    error.status === 404 &&
    error.code !== "DRIVER_PROFILE_REQUIRED"
  ) {
    return "Trip history is not available on the server yet.";
  }
  return errorMessage(error, "Unable to load your trips.");
}
