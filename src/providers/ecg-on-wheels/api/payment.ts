import { ecgApi, unwrapObject } from "./client";

export async function getPayment(bookingId: string) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/payment`));
}

export async function createPayment(bookingId: string, payload: any) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/payment`, {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function updatePayment(bookingId: string, payload: any) {
  return unwrapObject(await ecgApi(`/booking/${bookingId}/payment`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }));
}
