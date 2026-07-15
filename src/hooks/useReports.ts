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
  normalizeReport,
  parseReportsList,
  parsePaginatedReports,
  REPORTS_STATS_URL,
  createReport as apiCreateReport,
  updateReport as apiUpdateReport,
  deleteReport as apiDeleteReport,
  type ReportStats,
  type CreateReportPayload,
  type UpdateReportPayload,
  type ReportsQueryParams,
  type PaginatedReports,
} from "@/lib/api";
import { useAuthSWR } from "@/hooks/useAuthSWR";

// ─── useReport (single) ──────────────────────────────────────────────────────

export function useReport(id: string | null) {
  const { data, isLoading, error } = useAuthSWR<Report>(
    id ? `/api/v1/reports/${id}` : null,
  );

  return {
    report: data ? normalizeReport(data) : null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useReports ───────────────────────────────────────────────────────────────

export interface UseReportsOptions {
  status?: ReportStatus;
  search?: string;
  author?: string;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

export interface UseReportsReturn {
  reports: Report[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<unknown>;
}

export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const { status, search, author, createdAfter, createdBefore, page = 1, limit = 20 } = options;

  const url = useMemo(
    () => buildReportsUrl({ status, search, author, createdAfter, createdBefore, page, limit }),
    [status, search, author, createdAfter, createdBefore, page, limit]
  );

  const { data, isLoading, error, mutate } = useAuthSWR<unknown>(url);

  const parsed: PaginatedReports = useMemo(
    () => (data !== undefined ? parsePaginatedReports(data) : { reports: [], total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false }),
    [data]
  );

  return {
    reports: parsed.reports,
    total: parsed.total,
    page: parsed.page,
    totalPages: parsed.totalPages,
    hasNextPage: parsed.hasNextPage,
    isLoading,
    error: error as Error | undefined,
    mutate,
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
      const report = await apiCreateReport(payload);
      invalidateReportsCache();
      return report;
    },
    [invalidateReportsCache],
  );

  const updateReport = useCallback(
    async (id: string, payload: UpdateReportPayload): Promise<Report> => {
      const report = await apiUpdateReport(id, payload);
      invalidateReportsCache();
      return report;
    },
    [invalidateReportsCache],
  );

  const deleteReport = useCallback(
    async (id: string): Promise<void> => {
      await apiDeleteReport(id);
      invalidateReportsCache();
    },
    [invalidateReportsCache],
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
