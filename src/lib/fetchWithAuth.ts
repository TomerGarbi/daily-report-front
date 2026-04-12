/**
 * fetchWithAuth
 *
 * A thin wrapper around `fetch` that:
 *  1. Attaches the in-memory access token as a Bearer header.
 *  2. On a 401 response, attempts a silent refresh and retries once.
 *
 * Notes from the API auth guide:
 *  - `credentials: "include"` is NOT needed for non-auth endpoints.
 *    The refresh cookie is scoped to `/api/v1/auth` and won't be sent anyway.
 *  - Only the refresh / login / logout calls need `credentials: "include"`.
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
