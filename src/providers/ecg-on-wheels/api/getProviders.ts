import { ecgApi } from "./client";

export async function getProviders() {
  return ecgApi("/providers");
}
