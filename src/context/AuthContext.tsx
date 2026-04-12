"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AuthContextValue, LoginCredentials, User } from "@/types/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Decode only the `exp` claim from a JWT (the only claim we read client-side). */
function getExpFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against concurrent refresh calls
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // -------------------------------------------------------------------------
  // Clear the proactive refresh timer
  // -------------------------------------------------------------------------
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch user profile from GET /auth/me (authoritative source of user info)
  // -------------------------------------------------------------------------
  const fetchMe = useCallback(async (token: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
  }, []);

  // -------------------------------------------------------------------------
  // Schedule a proactive refresh ~30s before the token expires
  // -------------------------------------------------------------------------
  const scheduleRefresh = useCallback(
    (token: string) => {
      clearRefreshTimer();
      const exp = getExpFromToken(token);
      if (exp === null) return;

      const msUntilExpiry = exp * 1000 - Date.now();
      const refreshIn = msUntilExpiry - 30_000; // 30s before expiry

      if (refreshIn <= 0) {
        // Already expired or about to — refresh immediately
        doRefresh();
        return;
      }

      refreshTimerRef.current = setTimeout(() => doRefresh(), refreshIn);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // -------------------------------------------------------------------------
  // Core refresh logic (with concurrency guard)
  // -------------------------------------------------------------------------
  const doRefresh = useCallback(async (): Promise<string | null> => {
    // If a refresh is already in-flight, return the same promise
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const promise = (async (): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          // Any non-ok from /auth/refresh means session is dead
          clearRefreshTimer();
          setAccessToken(null);
          setUser(null);
          return null;
        }

        const data: { accessToken: string } = await res.json();
        setAccessToken(data.accessToken);
        scheduleRefresh(data.accessToken);
        return data.accessToken;
      } catch {
        clearRefreshTimer();
        setAccessToken(null);
        setUser(null);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearRefreshTimer, scheduleRefresh]);

  /** Public alias for consumers (useAuthFetch, etc.) */
  const refreshAccessToken = doRefresh;

  // -------------------------------------------------------------------------
  // On mount — silent refresh to restore session + hydrate user via /auth/me
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) throw new Error("refresh failed");

        const { accessToken: token }: { accessToken: string } =
          await res.json();

        if (cancelled) return;

        setAccessToken(token);
        scheduleRefresh(token);

        // Hydrate user from GET /auth/me — never decode from the token
        const me = await fetchMe(token);
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearRefreshTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ?? "Login failed"
        );
      }

      const data: { accessToken: string; user: User } = await res.json();

      setAccessToken(data.accessToken);
      scheduleRefresh(data.accessToken);

      // Hydrate user from GET /auth/me (authoritative source)
      const me = await fetchMe(data.accessToken);
      setUser(me);
    },
    [fetchMe, scheduleRefresh]
  );

  // -------------------------------------------------------------------------
  // Logout — requires both Bearer token and credentials: "include"
  // -------------------------------------------------------------------------
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      });
    } finally {
      clearRefreshTimer();
      setAccessToken(null);
      setUser(null);
    }
  }, [accessToken, clearRefreshTimer]);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    isLoading,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
