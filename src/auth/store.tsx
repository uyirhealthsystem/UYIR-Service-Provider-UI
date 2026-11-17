import { setProUserId } from "../providers/pro/api/client";
import { setHbcUserId } from "../providers/home-based-care/api/client";
import { setLaboratoryAccessToken } from "../providers/laboratory/api/client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { clearStoredUser, loadStoredUser, saveStoredUser } from "./persist";
import {
  clearAuthSession,
  getAccessToken,
  getAuthUserId,
  getRefreshToken,
  onSessionExpired,
  onTokensRefreshed,
  revokeSession,
  setAuthSession,
} from "./session";

type AuthUser = {
  id: string;
  sub: string;
  providerType: string;
  role: string;
  accessToken: string;
  refreshToken?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the saved login (if any) has been loaded at app start. */
  restoring: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Put a user's tokens into the API session and set the per-provider ids the OTP screen sets. */
function applySession(user: AuthUser) {
  const userId = user.sub || user.id;
  const role = user.providerType || user.role;
  setAuthSession({ accessToken: user.accessToken, refreshToken: user.refreshToken, userId, role });
  if (role === "LS") setLaboratoryAccessToken(user.accessToken, userId);
  if (role === "HBC") setHbcUserId(userId);
  if (role === "PRO") setProUserId(userId);
}

function clearProviderIds() {
  setProUserId(null);
  setHbcUserId(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);
  const userRef = useRef<AuthUser | null>(null);

  const commit = (next: AuthUser | null) => {
    userRef.current = next;
    setUserState(next);
    if (next) saveStoredUser(next);
    else clearStoredUser();
  };

  const setUser = (nextUser: AuthUser | null) => {
    if (!nextUser) {
      clearAuthSession();
      clearProviderIds();
      commit(null);
      return;
    }

    // Registration screens pass the tokens they got at login. If those were
    // refreshed since (refresh tokens rotate), keep the newer ones from the session.
    const userId = nextUser.sub || nextUser.id;
    const fresher =
      getAuthUserId() === userId && getRefreshToken()
        ? { accessToken: getAccessToken(), refreshToken: getRefreshToken() }
        : {};
    const merged = { ...nextUser, ...fresher };

    applySession(merged);
    commit(merged);
  };

  const logout = () => {
    revokeSession(getRefreshToken()); // tell the server; don't wait for it
    clearAuthSession();
    clearProviderIds();
    commit(null);
  };

  // Open the app already signed in when a login was saved.
  useEffect(() => {
    let cancelled = false;
    loadStoredUser().then((saved) => {
      if (cancelled) return;
      if (saved) {
        applySession(saved);
        userRef.current = saved;
        setUserState(saved);
      }
      setRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save refreshed tokens (the old refresh token stops working once used).
  // If the session can't be refreshed, forget the saved login and go to the login screen.
  useEffect(() => {
    const offTokens = onTokensRefreshed((tokens) => {
      if (userRef.current) commit({ ...userRef.current, ...tokens });
    });
    const offExpired = onSessionExpired(() => {
      clearProviderIds();
      commit(null);
    });
    return () => {
      offTokens();
      offExpired();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, restoring, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
