/**
 * fetchWithAuth
 *
 * A thin wrapper around `fetch` that:
 *  1. Attaches the in-memory access token as a Bearer header.
 *  2. On a 401 response, requests a new access token via the refresh endpoint
 *     (the refresh-token httpOnly cookie is sent automatically).
 *  3. Retries the original request once with the new token.
 *
 * Usage:
 *   const res = await fetchWithAuth(getToken, refreshToken, "/api/reports");
 *
 * Typically you create a pre-bound version inside your components/hooks via
 * the useAuthFetch hook below.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function fetchWithAuth(
  /** Returns the current in-memory access token */
  getToken: () => string | null,
  /** Calls the refresh endpoint and returns the new token (or null) */
  refreshToken: () => Promise<string | null>,
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  const buildInit = (token: string | null): RequestInit => ({
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const url =
    typeof input === "string" && !input.startsWith("http")
      ? `${API_BASE}${input}`
      : input;

  let res = await fetch(url, buildInit(getToken()));

  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      res = await fetch(url, buildInit(newToken));
    }
  }

  return res;
}
