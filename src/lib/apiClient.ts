/**
 * apiClient.ts
 *
 * The ONE and ONLY HTTP entry point for talking to the DailyReport API.
 * Every request — anywhere in the app — goes through this axios instance.
 *
 * Responsibilities:
 *  1. Attach the in-memory access token as a Bearer header on every request.
 *  2. Attach a per-request `X-Request-Id` for backend log correlation.
 *  3. On a 401 response, silently call the refresh endpoint once, then retry
 *     the original request with the new access token.
 *  4. Ensure the refresh cookie is sent on `/api/v1/auth/{login,refresh,logout}`
 *     by forcing `withCredentials` for those routes only. Non-auth endpoints
 *     do NOT send the cookie — matches the backend cookie scope
 *     (`Path=/api/v1/auth`).
 *
 * Access token lifecycle:
 *  - `setAuthToken(token)` is called by `AuthContext` synchronously whenever
 *    the token changes (login / refresh / logout). This keeps the interceptor
 *    in perfect sync with the React state without ref/effect races.
 *  - `registerAuthHandlers({ refreshAccessToken, onAuthFailure })` wires the
 *    single-flight refresh function from `AuthContext` into the 401 retry
 *    interceptor so we never duplicate refresh logic.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { env } from "./env";
import { reportException } from "./errorReporter";

// ---------------------------------------------------------------------------
// Type augmentation
// ---------------------------------------------------------------------------
// Extend axios's request-config types so callers can pass our custom
// `skipAuth` flag without a TS excess-property error. `_retry` is internal
// but declared here for completeness.
declare module "axios" {
  interface AxiosRequestConfig {
    /** Skip attaching the Bearer Authorization header on this request. */
    skipAuth?: boolean;
    /** Internal — set by the response interceptor to prevent retry loops. */
    _retry?: boolean;
  }
  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

// ---------------------------------------------------------------------------
// Token storage (module-scoped, synchronously mutable)
// ---------------------------------------------------------------------------

let currentAccessToken: string | null = null;

/** Store / clear the current in-memory access token. Called by AuthContext. */
export function setAuthToken(token: string | null): void {
  currentAccessToken = token;
}

/** Read the current in-memory access token (mainly for tests / debugging). */
export function getAuthToken(): string | null {
  return currentAccessToken;
}

// ---------------------------------------------------------------------------
// Auth handler registration (refresh + failure callback)
// ---------------------------------------------------------------------------

interface AuthHandlers {
  /**
   * Calls the refresh endpoint and returns the new access token, or null if
   * the session is dead. MUST be single-flight (dedupe concurrent callers).
   */
  refreshAccessToken: () => Promise<string | null>;
  /** Invoked when refresh fails — typically to clear state / redirect. */
  onAuthFailure?: () => void;
  /**
   * Invoked on a 403 response. Unlike 401 we don't try to refresh — the
   * user is authenticated but not allowed. Consumers typically show a
   * toast + let the section-level boundary render an "access denied" view.
   */
  onPermissionDenied?: (context: { url: string | undefined; status: number }) => void;
}

const noopHandlers: AuthHandlers = {
  refreshAccessToken: async () => null,
  onAuthFailure: () => {},
  onPermissionDenied: () => {},
};

let handlers: AuthHandlers = noopHandlers;

/**
 * Register auth callbacks with the shared apiClient.
 * Called from `AuthProvider` on mount. Returns an `unregister` function.
 */
export function registerAuthHandlers(next: AuthHandlers): () => void {
  handlers = { ...noopHandlers, ...next };
  return () => {
    if (handlers === next) handlers = noopHandlers;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Endpoints that must send the HTTP-only refresh cookie. */
const AUTH_COOKIE_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
];

function isAuthCookiePath(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.startsWith("http")
    ? (() => {
        try {
          return new URL(url).pathname;
        } catch {
          return url;
        }
      })()
    : url;
  return AUTH_COOKIE_PATHS.some((p) => path.startsWith(p));
}

/** Short, URL-safe request id for correlation with backend logs. */
function makeRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  headers: { "Content-Type": "application/json" },
  // Default off — only auth endpoints opt in via the request interceptor.
  withCredentials: false,
});

// ---- Request interceptor ---------------------------------------------------

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Force credentials on auth endpoints so the refresh cookie is sent.
  if (isAuthCookiePath(config.url)) {
    config.withCredentials = true;
  }

  // Attach Bearer unless caller opted out or already provided one.
  if (!config.skipAuth && currentAccessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }

  // Per-request correlation id.
  if (!config.headers["X-Request-Id"]) {
    config.headers["X-Request-Id"] = makeRequestId();
  }

  return config;
});

// ---- Response interceptor: silent refresh on 401 --------------------------

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    // 5xx — surface to the error reporter for triage. Do this early so
    // network errors (no response) still get captured when status is
    // undefined AND no request config exists (e.g., DNS failures).
    if (status === undefined || status >= 500) {
      reportException(error, {
        section: "apiClient",
        tags: {
          method: (original?.method ?? "unknown").toUpperCase(),
          url: original?.url ?? "unknown",
          status: status !== undefined ? String(status) : "network",
        },
      });
    }

    // 403 — authenticated but forbidden. Notify handler, then reject as-is.
    if (status === 403 && original && !original.skipAuth) {
      handlers.onPermissionDenied?.({ url: original.url, status });
      return Promise.reject(error);
    }

    if (
      !original ||
      status !== 401 ||
      original._retry ||
      original.skipAuth
    ) {
      return Promise.reject(error);
    }

    // Never try to refresh the refresh call itself — that would recurse.
    if (isAuthCookiePath(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    const newToken = await handlers.refreshAccessToken();
    if (!newToken) {
      handlers.onAuthFailure?.();
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  }
);

// ---------------------------------------------------------------------------
// Typed error extraction
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  message?: string;
  errors?: unknown;
  [key: string]: unknown;
}

export interface ApiError extends Error {
  status?: number;
  body?: ApiErrorBody;
}

/**
 * Turn any thrown value into a normalized `ApiError`. Preserves axios's
 * `response.status` and `response.data` on the resulting Error so callers
 * (SWR, form handlers) can inspect them uniformly.
 */
export function toApiError(err: unknown, fallbackMessage = "Request failed"): ApiError {
  if (axios.isAxiosError(err)) {
    const body = (err.response?.data ?? undefined) as ApiErrorBody | undefined;
    const message =
      (typeof body?.message === "string" && body.message) ||
      err.message ||
      fallbackMessage;
    const out = new Error(message) as ApiError;
    out.status = err.response?.status;
    out.body = body;
    return out;
  }
  if (err instanceof Error) {
    return err as ApiError;
  }
  return new Error(fallbackMessage) as ApiError;
}

/** Convenience predicate for `axios.isAxiosError`, re-exported for callers. */
export const isAxiosError = axios.isAxiosError;
