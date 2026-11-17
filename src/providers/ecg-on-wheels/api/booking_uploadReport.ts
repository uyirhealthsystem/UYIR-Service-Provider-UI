import { ecgApi } from "./client";

export async function uploadReport(bookingId: string, file: { uri: string; name: string; type: string }) {
  const formData = new FormData();
  formData.append("file", { uri: file.uri, name: file.name, type: file.type } as any);
  return ecgApi(`/booking/${bookingId}/report`, { method: "POST", body: formData });
}
