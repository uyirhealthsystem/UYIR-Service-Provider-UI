import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../../../auth/store";
import { HbcApiError, errorMessage, setHbcUserId } from "../../api/client";
import { getMyProfile } from "../../api/profile";
import type { Provider } from "../../api/types";

type HbcStore = {
  profile: Provider | null;
  loading: boolean;
  error: string;
  // True when GET /provider/profile returned 404: the user must register first.
  notRegistered: boolean;
  refresh: () => Promise<void>;
  setProfile: (profile: Provider) => void;
};

const HbcContext = createContext<HbcStore | undefined>(undefined);

export function HbcProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notRegistered, setNotRegistered] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setHbcUserId(user?.sub || user?.id);
      const me = await getMyProfile();
      setProfileState(me);
      setNotRegistered(false);
    } catch (e) {
      if (e instanceof HbcApiError && e.status === 404) {
        setNotRegistered(true);
        setProfileState(null);
      } else {
        setError(errorMessage(e, "Unable to load your provider profile."));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.sub, user?.id, user?.accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setProfile = useCallback((next: Provider) => {
    setProfileState(next);
    setNotRegistered(false);
  }, []);

  return (
    <HbcContext.Provider value={{ profile, loading, error, notRegistered, refresh, setProfile }}>
      {children}
    </HbcContext.Provider>
  );
}

export function useHbcStore() {
  const context = useContext(HbcContext);
  if (!context) throw new Error("useHbcStore must be used inside HbcProvider");
  return context;
}

// Registration screens are mounted both in the auth stack (no provider) and
// inside the HBC stack (provider present) — this lets them work in either.
export function useOptionalHbcStore() {
  return useContext(HbcContext);
}
