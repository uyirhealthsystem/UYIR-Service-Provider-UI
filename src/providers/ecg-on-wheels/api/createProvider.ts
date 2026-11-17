import { ecgApi } from "./client";

export async function createProvider(payload: Record<string, unknown>) {
  return ecgApi("/provider", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
