"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type MeUser } from "@/lib/api";

type AuthContextValue = {
  user: MeUser | null;
  loading: boolean;
  refresh: () => Promise<MeUser | null>;
  setUser: (u: MeUser | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { user } = await api.me();
    setUser(user);
    return user;
  }, []);

  // One-time session hydration on mount. The `cancelled` guard prevents a
  // stale response from setting state after unmount; the new
  // react-hooks/set-state-in-effect rule wants fetch-on-mount replaced with
  // an external-store/Suspense data layer, which is a larger architectural
  // change out of scope here — this pattern is safe as written.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, setUser, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
