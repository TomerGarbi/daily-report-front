"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AuthContextValue, LoginCredentials, User } from "@/types/auth";
import {
  apiClient,
  registerAuthHandlers,
  setAuthToken,
  toApiError,
} from "@/lib/apiClient";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decode only the `exp` claim from a JWT (the only claim we read client-side). */
function getExpFromToken(token: string): number | null {
  try {
    const parts = token.split(".");
    const payloadPart = parts[1];
    if (!payloadPart) return null;
    const payload = JSON.parse(atob(payloadPart));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

interface AuthResponse {
  accessToken: string;
  expiresAt?: string | null;
  user?: User;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("errors");

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against concurrent refresh calls
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  // Keep the latest translator in a ref so callbacks registered once at
  // mount can read fresh strings without re-registration.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // -------------------------------------------------------------------------
  // Token commit — updates React state AND the apiClient's cached token
  // synchronously, so the very next apiClient call sees the new value with
  // no useEffect race.
  // -------------------------------------------------------------------------
  const commitAccessToken = useCallback((token: string | null) => {
    setAuthToken(token);
    setAccessTokenState(token);
  }, []);

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
  const fetchMe = useCallback(async (): Promise<User> => {
    try {
      const { data } = await apiClient.get<User>("/api/v1/auth/me");
      return data;
    } catch (err) {
      throw toApiError(err, "Failed to fetch user profile");
    }
  }, []);

  // -------------------------------------------------------------------------
  // Schedule a proactive refresh ~30s before the token expires.
  // The API returns an absolute `expiresAt` ISO timestamp on /login and
  // /refresh; when present we use it directly (more robust to client clock
  // drift than decoding the JWT). We fall back to decoding the token if the
  // server didn't include `expiresAt` (e.g. older API).
  // -------------------------------------------------------------------------
  const scheduleRefresh = useCallback(
    (token: string, expiresAt?: string | null) => {
      clearRefreshTimer();

      let expMs: number | null = null;
      if (expiresAt) {
        const parsed = Date.parse(expiresAt);
        if (!Number.isNaN(parsed)) expMs = parsed;
      }
      if (expMs === null) {
        const exp = getExpFromToken(token);
        if (exp !== null) expMs = exp * 1000;
      }
      if (expMs === null) return;

      const msUntilExpiry = expMs - Date.now();
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
  // Core refresh logic (single-flight)
  // -------------------------------------------------------------------------
  const doRefresh = useCallback(async (): Promise<string | null> => {
    // If a refresh is already in-flight, return the same promise
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const promise = (async (): Promise<string | null> => {
      try {
        // skipAuth=true so the 401-retry interceptor doesn't try to refresh
        // in response to a failed refresh (would recurse). withCredentials
        // is forced by the request interceptor for this path.
        const { data } = await apiClient.post<AuthResponse>(
          "/api/v1/auth/refresh",
          undefined,
          { skipAuth: true },
        );
        commitAccessToken(data.accessToken);
        scheduleRefresh(data.accessToken, data.expiresAt);
        return data.accessToken;
      } catch {
        clearRefreshTimer();
        commitAccessToken(null);
        setUser(null);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearRefreshTimer, commitAccessToken, scheduleRefresh]);

  /** Public alias for context consumers. */
  const refreshAccessToken = doRefresh;

  // -------------------------------------------------------------------------
  // Register the refresh callback with the shared apiClient. Registered
  // once on mount; the single-flight `doRefresh` is stable across renders
  // and the module-level token cache is kept in sync by `commitAccessToken`.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const unregister = registerAuthHandlers({
      refreshAccessToken: doRefresh,
      onAuthFailure: () => {
        // Session is dead — surface a toast so the user knows why they're
        // being redirected, then clear local state. Route-level guards
        // handle the actual redirect.
        toast.error(tRef.current("sessionExpired"));
        clearRefreshTimer();
        commitAccessToken(null);
        setUser(null);
      },
      onPermissionDenied: () => {
        toast.error(tRef.current("permissionDenied"));
      },
    });
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // On mount — silent refresh to restore session + hydrate user via /auth/me
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await doRefresh();
        if (cancelled) return;

        if (token) {
          // Hydrate user from GET /auth/me — never decode from the token
          const me = await fetchMe();
          if (!cancelled) setUser(me);
        }
      } catch {
        if (!cancelled) {
          commitAccessToken(null);
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
      let data: AuthResponse;
      try {
        // skipAuth=true because no Bearer exists yet; withCredentials is
        // forced by the request interceptor for this path.
        const res = await apiClient.post<AuthResponse>(
          "/api/v1/auth/login",
          credentials,
          { skipAuth: true },
        );
        data = res.data;
      } catch (err) {
        throw toApiError(err, "Login failed");
      }

      commitAccessToken(data.accessToken);
      scheduleRefresh(data.accessToken, data.expiresAt);

      // Hydrate user from GET /auth/me (authoritative source). Bearer will
      // be attached automatically by the interceptor now that the token is
      // set synchronously via commitAccessToken().
      const me = await fetchMe();
      setUser(me);
    },
    [commitAccessToken, fetchMe, scheduleRefresh]
  );

  // -------------------------------------------------------------------------
  // Logout — requires both Bearer token and the refresh cookie.
  // Both are handled by the interceptors: Bearer via the module-level token,
  // cookie via the AUTH_COOKIE_PATHS `withCredentials` override.
  // -------------------------------------------------------------------------
  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch {
      // Best-effort — always clear local state even if the network call fails.
    } finally {
      clearRefreshTimer();
      commitAccessToken(null);
      setUser(null);
    }
  }, [clearRefreshTimer, commitAccessToken]);

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
