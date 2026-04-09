/**
 * useReports.ts
 *
 * Shared data hooks for reports.
 * Both the reports page and the calendar page use useReports(),
 * so SWR automatically deduplicates the network request when both are mounted.
 *
 * useReportStats() wraps the /reports/stats endpoint with SWR caching.
 *
 * useReportMutations() exposes typed create / update / delete helpers that
 * automatically invalidate the SWR cache after a successful mutation.
 */

import { useMemo, useCallback } from "react";
import { useSWRConfig, KeyedMutator } from "swr";
import { Report, ReportStatus } from "@/types/report";
import {
  buildReportsUrl,
  parseReportsList,
  REPORTS_STATS_URL,
  createReport as apiCreateReport,
  updateReport as apiUpdateReport,
  deleteReport as apiDeleteReport,
  type ReportStats,
  type CreateReportPayload,
  type UpdateReportPayload,
} from "@/lib/api";
import { useAuthSWR } from "@/hooks/useAuthSWR";
import { useAuthFetch } from "@/hooks/useAuthFetch";

// ─── useReports ───────────────────────────────────────────────────────────────

export interface UseReportsOptions {
  /** Only pass when you want to send a single status to the backend. */
  status?: ReportStatus;
  limit?: number;
}

export interface UseReportsReturn {
  reports: Report[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<Report[]>;
}

export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const { status, limit = 100 } = options;

  const url = useMemo(
    () => buildReportsUrl({ status, limit }),
    [status, limit]
  );

  const { data, isLoading, error, mutate } = useAuthSWR<unknown>(url);

  const reports: Report[] = useMemo(
    () => (data !== undefined ? parseReportsList(data) : []),
    [data]
  );

  return {
    reports,
    isLoading,
    error: error as Error | undefined,
    mutate: mutate as KeyedMutator<Report[]>,
  };
}

// ─── useReportStats ───────────────────────────────────────────────────────────

export interface UseReportStatsReturn {
  stats: ReportStats | null;
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * SWR-powered hook for the /reports/stats endpoint.
 * Replaces manual useState + useEffect + authFetch patterns.
 */
export function useReportStats(): UseReportStatsReturn {
  const { data, isLoading, error } = useAuthSWR<ReportStats>(REPORTS_STATS_URL);

  return {
    stats: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useReportMutations ───────────────────────────────────────────────────────

export interface UseReportMutationsReturn {
  /** Create a report and invalidate the reports + stats cache. */
  createReport: (payload: CreateReportPayload) => Promise<Report>;
  /** Update a report and invalidate the reports + stats cache. */
  updateReport: (id: string, payload: UpdateReportPayload) => Promise<Report>;
  /** Delete a report and invalidate the reports + stats cache. */
  deleteReport: (id: string) => Promise<void>;
}

/**
 * Returns typed mutation functions that automatically revalidate
 * all SWR keys matching the reports endpoints after success.
 */
export function useReportMutations(): UseReportMutationsReturn {
  const authFetch = useAuthFetch();
  const { mutate: globalMutate } = useSWRConfig();

  /** Revalidate all SWR keys that start with /api/v1/reports */
  const invalidateReportsCache = useCallback(() => {
    globalMutate(
      (key) => typeof key === "string" && key.startsWith("/api/v1/reports"),
      undefined,
      { revalidate: true },
    );
  }, [globalMutate]);

  const createReport = useCallback(
    async (payload: CreateReportPayload): Promise<Report> => {
      const report = await apiCreateReport(authFetch, payload);
      invalidateReportsCache();
      return report;
    },
    [authFetch, invalidateReportsCache],
  );

  const updateReport = useCallback(
    async (id: string, payload: UpdateReportPayload): Promise<Report> => {
      const report = await apiUpdateReport(authFetch, id, payload);
      invalidateReportsCache();
      return report;
    },
    [authFetch, invalidateReportsCache],
  );

  const deleteReport = useCallback(
    async (id: string): Promise<void> => {
      await apiDeleteReport(authFetch, id);
      invalidateReportsCache();
    },
    [authFetch, invalidateReportsCache],
  );

  return { createReport, updateReport, deleteReport };
}

// ─── Client-side filter helper (used in both pages) ───────────────────────────

export interface ReportClientFilters {
  search?: string;
  status?: ReportStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export function applyClientFilters(
  reports: Report[],
  filters: ReportClientFilters
): Report[] {
  const search   = (filters.search ?? "").trim().toLowerCase();
  const statuses = filters.status ?? [];
  const from     = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : null;
  const to       = filters.dateTo   ? new Date(filters.dateTo   + "T23:59:59") : null;

  return reports.filter((r) => {
    // Full-text search across title, description, and submitter name
    if (search) {
      const haystack = [
        r.title,
        r.description ?? "",
        r.createdBy?.username ?? "",
      ].join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    // Multi-status filter (if fewer than all statuses are selected)
    if (statuses.length > 0 && statuses.length < 2 && !statuses.includes(r.status)) return false;

    // Date range
    const created = new Date(r.createdAt);
    if (from && created < from) return false;
    if (to   && created > to)   return false;

    return true;
  });
}
