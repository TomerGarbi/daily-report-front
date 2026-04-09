"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AuthContextValue, LoginCredentials, User } from "@/types/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decode the payload of a JWT without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** Return how many milliseconds until the token expires, minus a 30-second buffer. */
function msUntilExpiry(token: string): number {
  const payload = decodeJwtPayload(token);
  if (typeof payload.exp !== "number") return 0;
  return payload.exp * 1000 - Date.now() - 30_000;
}

// ---------------------------------------------------------------------------
// API base URL – adjust to match your backend
// ---------------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while restoring session

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Schedule a silent refresh before the token expires
  // -------------------------------------------------------------------------
  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const delay = msUntilExpiry(token);
    if (delay <= 0) return; // already expired / no exp claim

    refreshTimerRef.current = setTimeout(() => {
      silentRefresh();
    }, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Apply a newly obtained access token
  // -------------------------------------------------------------------------
  const applyToken = useCallback(
    (token: string) => {
      const payload = decodeJwtPayload(token);
      setAccessToken(token);
      setUser(payload as User);
      scheduleRefresh(token);
    },
    [scheduleRefresh]
  );

  // -------------------------------------------------------------------------
  // Refresh the access token using the httpOnly refresh-token cookie
  // -------------------------------------------------------------------------
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the httpOnly refresh-token cookie
      });

      if (!res.ok) {
        // Refresh token is invalid / expired – clear state
        setAccessToken(null);
        setUser(null);
        return null;
      }

      const data: { accessToken: string } = await res.json();
      applyToken(data.accessToken);
      return data.accessToken;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, [applyToken]);

  // Named alias used internally to avoid a circular dep warning in the effect
  const silentRefresh = refreshAccessToken;

  // -------------------------------------------------------------------------
  // On mount – try to restore session via refresh token cookie
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await refreshAccessToken();
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // server will Set-Cookie the refresh token
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message ?? "Login failed"
        );
      }

      const data: { accessToken: string } = await res.json();
      applyToken(data.accessToken);
    },
    [applyToken]
  );

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include", // server will clear the refresh-token cookie
      });
    } finally {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      setAccessToken(null);
      setUser(null);
    }
  }, []);

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

// ---------------------------------------------------------------------------
// Internal export so the fetch utility can access the context value
// ---------------------------------------------------------------------------
export { AuthContext };
