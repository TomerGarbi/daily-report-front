/**
 * useLastYearArchive.ts
 *
 * SWR-backed hook returning the same calendar day one year ago. Used by
 * the "archive" stepper section to render a year-over-year comparison
 * alongside yesterday's data.
 */

import type { LastYearArchiveData } from "@/types/report";
import { useAuthSWR } from "@/hooks/useAuthSWR";

export interface UseLastYearArchiveReturn {
  lastYear: LastYearArchiveData | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useLastYearArchive(enabled: boolean = true): UseLastYearArchiveReturn {
  const { data, isLoading, error } = useAuthSWR<LastYearArchiveData>(
    enabled ? "/api/v1/reports/archive/last-year" : null,
  );

  return {
    lastYear: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}
