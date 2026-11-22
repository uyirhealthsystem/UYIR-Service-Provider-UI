import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { getDashboard } from "../../api/healthPartner";

/** The signed-in HP's referral code (from the dashboard call). */
export function useReferralCode() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const dashboard = await getDashboard();
      setCode(dashboard?.referralCode || null);
    } catch (e: any) {
      console.log("HP referral code error:", e);
      setError(e?.message || "Unable to load your referral code.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { code, error, retry: load };
}
