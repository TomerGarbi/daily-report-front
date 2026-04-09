/**
 * useAuthSWR.ts
 *
 * A thin wrapper around SWR that automatically uses the authenticated fetcher.
 * The SWR key is the URL string; the fetcher calls authFetch under the hood.
 *
 * - While `isAuthenticated` is false the key is set to `null` so SWR won't fire.
 * - Throws on non-ok responses (SWR picks these up as `error`).
 */

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export function useAuthSWR<T>(
  /** URL to fetch (relative path). Pass `null` to suspend fetching. */
  url: string | null,
  options?: SWRConfiguration<T>
): SWRResponse<T> {
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();

  const fetcher = async (u: string): Promise<T> => {
    const res = await authFetch(u);
    if (!res.ok) {
      const err = new Error(`API error ${res.status}`);
      (err as any).status = res.status;
      throw err;
    }
    return res.json() as Promise<T>;
  };

  // Only fetch when authenticated; setting key to null pauses SWR
  const key = isAuthenticated ? url : null;

  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5_000,
    ...options,
  });
}
