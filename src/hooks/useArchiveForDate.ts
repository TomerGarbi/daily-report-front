/**
 * useArchiveForDate.ts
 *
 * SWR hook that fetches the same archive payload as `useYesterdayArchive`
 * but for an arbitrary calendar day (passed as an ISO date string,
 * `YYYY-MM-DD`). Used by the archive section's "extra days" cards to
 * auto-prefill historical entries.
 *
 * Pass `null` to disable.
 */

import type { ArchiveData } from "@/types/report";
import { useAuthSWR } from "@/hooks/useAuthSWR";

export interface UseArchiveForDateReturn {
  archive: ArchiveData | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useArchiveForDate(date: string | null): UseArchiveForDateReturn {
  const key = date ? `/api/v1/reports/archive/yesterday?date=${date}` : null;
  const { data, isLoading, error } = useAuthSWR<ArchiveData>(key);

  return {
    archive: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}
