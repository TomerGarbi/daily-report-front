/**
 * useAuthSWR.ts
 *
 * A thin wrapper around SWR that fetches with the shared axios `apiClient`.
 * The SWR key is the URL string; the fetcher hits apiClient under the hood.
 *
 * - While `isAuthenticated` is false the key is set to `null` so SWR won't fire.
 * - Any non-2xx response becomes a rejected promise (SWR picks it up as `error`).
 * - Retries transient network / 5xx failures with capped exponential backoff;
 *   4xx (bad request, forbidden, not-found) are never retried since retrying
 *   won't change the outcome.
 */

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, toApiError, type ApiError } from "@/lib/apiClient";

async function fetcher<T>(url: string): Promise<T> {
  try {
    const { data } = await apiClient.get<T>(url);
    return data;
  } catch (err) {
    throw toApiError(err, `API error for ${url}`);
  }
}

export function useAuthSWR<T>(
  /** URL to fetch (relative path). Pass `null` to suspend fetching. */
  url: string | null,
  options?: SWRConfiguration<T>,
): SWRResponse<T> {
  const { isAuthenticated } = useAuth();

  // Only fetch when authenticated; setting key to null pauses SWR.
  const key = isAuthenticated ? url : null;

  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5_000,
    errorRetryCount: 3,
    errorRetryInterval: 2_000,
    // Don't retry 4xx — bad request / forbidden / not-found won't succeed
    // on retry. 401 is handled by the apiClient interceptor's refresh flow.
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      const status = (error as ApiError).status;
      if (typeof status === "number" && status >= 400 && status < 500) return;
      if (retryCount >= (config.errorRetryCount ?? 3)) return;
      // Exponential backoff capped at 30s.
      const delay = Math.min(
        (config.errorRetryInterval ?? 2_000) * 2 ** retryCount,
        30_000,
      );
      setTimeout(() => revalidate({ retryCount }), delay);
    },
    ...options,
  });
}
