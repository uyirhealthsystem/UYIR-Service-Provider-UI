import { earningsByPeriod, sumFares } from "../domain/trip";
import type { Booking, BookingStatus, Offer, TripHistoryPage } from "../types";
import { ambulanceApi } from "./client";

const MAX_PAGE_SIZE = 100;

export function getOpenOffers() {
  return ambulanceApi<Offer[]>("/driver/bookings/offers");
}

export function getCurrentBooking() {
  return ambulanceApi<Booking | null>("/driver/bookings/current");
}

export function getTripHistory({
  page = 0,
  size = 20,
  status,
}: {
  page?: number;
  size?: number;
  status?: BookingStatus;
} = {}) {
  const statusQuery = status ? `&status=${status}` : "";
  return ambulanceApi<TripHistoryPage>(
    `/driver/bookings/history?page=${page}&size=${size}${statusQuery}`,
  );
}

async function getAllTrips(status: BookingStatus) {
  const trips: Booking[] = [];
  let page = 0;
  let total = 0;

  do {
    const result = await getTripHistory({ page, size: MAX_PAGE_SIZE, status });
    total = result.totalBookings;
    trips.push(...result.bookings);
    page += 1;
    if (result.bookings.length === 0) break;
  } while (trips.length < total);

  return trips;
}

/** The server has no earnings endpoint, so trip fares are added up here. */
export async function getEarningsSummary() {
  const [completed, awaitingPayment, allTrips] = await Promise.all([
    getAllTrips("COMPLETED"),
    getAllTrips("PAYMENT_PENDING"),
    getTripHistory({ size: 1 }),
  ]);

  return {
    totalEarnings: sumFares(completed),
    completedTrips: completed.length,
    totalTrips: allTrips.totalBookings,
    pendingAmount: sumFares(awaitingPayment),
    pendingTrips: awaitingPayment.length,
    periods: earningsByPeriod(completed),
    recentTrips: completed.slice(0, 5),
  };
}

export function acceptBooking(bookingId: string) {
  return ambulanceApi<Booking>(`/driver/bookings/${bookingId}/accept`, {
    method: "POST",
  });
}

export function rejectBooking(bookingId: string) {
  return ambulanceApi<{ ok: boolean }>(`/driver/bookings/${bookingId}/reject`, {
    method: "POST",
  });
}

export function arrivedAtPickup(bookingId: string) {
  return ambulanceApi<Booking>(`/driver/bookings/${bookingId}/arrived`, {
    method: "POST",
  });
}

export function pickupPatient(bookingId: string, otp: string) {
  return ambulanceApi<Booking>(`/driver/bookings/${bookingId}/pickup`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export function dropPatient(bookingId: string) {
  return ambulanceApi<Booking>(`/driver/bookings/${bookingId}/drop`, {
    method: "POST",
  });
}
