"use client";

import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

/**
 * Returns a `fetch`-like function that automatically attaches the Bearer token
 * and handles silent token refresh on 401.
 *
 * Example:
 *   const authFetch = useAuthFetch();
 *   const res = await authFetch("/api/reports");
 */
export function useAuthFetch() {
  const { accessToken, refreshAccessToken } = useAuth();

  return useCallback(
    (input: string | URL, init?: RequestInit) =>
      fetchWithAuth(
        () => accessToken,
        refreshAccessToken,
        input,
        init
      ),
    [accessToken, refreshAccessToken]
  );
}
