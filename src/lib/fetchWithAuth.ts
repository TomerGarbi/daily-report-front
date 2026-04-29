/**
 * fetchWithAuth
 *
 * A thin wrapper around `fetch` that:
 *  1. Attaches the in-memory access token as a Bearer header.
 *  2. Generates a per-call `X-Request-Id` for backend log correlation.
 *  3. On a 401 response, attempts a silent refresh and retries once.
 *
 * Notes from the API auth guide:
 *  - `credentials: "include"` is NOT needed for non-auth endpoints.
 *    The refresh cookie is scoped to `/api/v1/auth` and won't be sent anyway.
 *  - Only the refresh / login / logout calls need `credentials: "include"`.
 */

import { env } from "./env";

const API_BASE = env.API_URL;

/** Generate a short, URL-safe request id for correlation with backend logs. */
function makeRequestId(): string {
  // Web Crypto is available in modern browsers and Node (Next.js runtime).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchWithAuth(
  /** Returns the current in-memory access token */
  getToken: () => string | null,
  /** Calls the refresh endpoint and returns the new token (or null) */
  refreshToken: () => Promise<string | null>,
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  const requestId = makeRequestId();

  const buildInit = (token: string | null): RequestInit => ({
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
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
