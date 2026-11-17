import { ecgApi } from "./client";

export async function getProviderMe() {
  return ecgApi("/provider/me");
}
