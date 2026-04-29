/**
 * useYesterdayArchive.ts
 *
 * SWR-backed hook returning yesterday's aggregated production + peak-hour
 * weather for the report's "archive" stepper section.
 */

import type { ArchiveData } from "@/types/report";
import { useAuthSWR } from "@/hooks/useAuthSWR";

export interface UseYesterdayArchiveReturn {
  archive: ArchiveData | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useYesterdayArchive(enabled: boolean = true): UseYesterdayArchiveReturn {
  const { data, isLoading, error } = useAuthSWR<ArchiveData>(
    enabled ? "/api/v1/reports/archive/yesterday" : null,
  );

  return {
    archive: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}
