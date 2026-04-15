import { useMemo } from "react";
import type { LogEntry, LogListResponse, LogStats } from "@/types/log";
import { buildLogsUrl, LOGS_STATS_URL, type LogsQueryParams } from "@/lib/logs-api";
import { useAuthSWR } from "@/hooks/useAuthSWR";

// ─── useLogs ──────────────────────────────────────────────────────────────────

export interface UseLogsReturn {
  logs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | undefined;
}

export function useLogs(params: LogsQueryParams = {}): UseLogsReturn {
  const url = useMemo(() => buildLogsUrl(params), [
    params.level,
    params.user,
    params.context,
    params.search,
    params.from,
    params.to,
    params.page,
    params.limit,
  ]);

  const { data, isLoading, error } = useAuthSWR<LogListResponse>(url);

  return {
    logs: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNextPage: data?.hasNextPage ?? false,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useLogStats ──────────────────────────────────────────────────────────────

export interface UseLogStatsReturn {
  stats: LogStats | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useLogStats(): UseLogStatsReturn {
  const { data, isLoading, error } = useAuthSWR<LogStats>(LOGS_STATS_URL);

  return {
    stats: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useLogEntry ──────────────────────────────────────────────────────────────

export function useLogEntry(id: string | null) {
  const { data, isLoading, error } = useAuthSWR<LogEntry>(
    id ? `/api/v1/logs/${id}` : null,
  );

  return {
    log: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}
