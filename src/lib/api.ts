/**
 * api.ts
 *
 * Typed API helpers for the /reports endpoints: URL builders, response
 * parsers, and mutation functions.
 *
 * All requests go through the shared `apiClient` (axios) — auth, refresh,
 * and request-id headers are handled by its interceptors.
 */

import {
  Report,
  ReportStatus,
  ReportContent,
  ArchiveData,
  LastYearArchiveData,
} from "@/types/report";
import { apiClient, toApiError } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportStats {
  total?: number;
  byStatus?: { draft?: number; published?: number };
  mine?: { total?: number; draft?: number; published?: number };
  recent?: { last7Days?: number; last30Days?: number };
  dailyCounts?: { date: string; count: number }[];
  topAuthors?: { username: string; count: number }[];
}

export interface CreateReportPayload {
  title: string;
  description: string;
  status?: ReportStatus;
  content: ReportContent;
}

export interface UpdateReportPayload extends Partial<CreateReportPayload> {}

// ─── URL builders ─────────────────────────────────────────────────────────────

export interface ReportsQueryParams {
  status?: "draft" | "published";
  search?: string;
  author?: string;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

export function buildReportsUrl(params: ReportsQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.status)                    q.set("status", params.status);
  if (params.search)                    q.set("search", params.search);
  if (params.author)                    q.set("author", params.author);
  if (params.createdAfter)              q.set("createdAfter", params.createdAfter);
  if (params.createdBefore)             q.set("createdBefore", params.createdBefore);
  if (params.page   != null)            q.set("page",  String(params.page));
  if (params.limit  != null)            q.set("limit", String(params.limit));
  return `/api/v1/reports?${q.toString()}`;
}

export const REPORTS_STATS_URL = "/api/v1/reports/stats";

// ─── Response normalizers ─────────────────────────────────────────────────────

/** Normalize a report so it always has a stable `id` field (handles both MongoDB `_id` and virtual `id`). */
export function normalizeReport(raw: Report): Report {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? "",
  };
}

/** Parse any shape the reports endpoint may return into a plain Report[]. */
export function parseReportsList(json: unknown): Report[] {
  let list: Report[];

  if (Array.isArray(json)) {
    list = json as Report[];
  } else if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    list = (obj.data ?? obj.reports ?? []) as Report[];
  } else {
    list = [];
  }

  return list.map(normalizeReport);
}

/** Parse the full paginated response from the reports endpoint. */
export interface PaginatedReports {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export function parsePaginatedReports(json: unknown): PaginatedReports {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    return {
      reports:     parseReportsList(json),
      total:       typeof obj.total === "number" ? obj.total : 0,
      page:        typeof obj.page === "number" ? obj.page : 1,
      limit:       typeof obj.limit === "number" ? obj.limit : 20,
      totalPages:  typeof obj.totalPages === "number" ? obj.totalPages : 1,
      hasNextPage: typeof obj.hasNextPage === "boolean" ? obj.hasNextPage : false,
    };
  }
  const list = parseReportsList(json);
  return { reports: list, total: list.length, page: 1, limit: list.length, totalPages: 1, hasNextPage: false };
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

/** POST /api/v1/reports — create a new report. */
export async function createReport(
  payload: CreateReportPayload,
): Promise<Report> {
  try {
    const { data } = await apiClient.post("/api/v1/reports", payload);
    return normalizeReport(data as Report);
  } catch (err) {
    throw toApiError(err, "שגיאה ביצירת הדוח");
  }
}

/** PATCH /api/v1/reports/:id — update an existing report. */
export async function updateReport(
  id: string,
  payload: UpdateReportPayload,
): Promise<Report> {
  try {
    const { data } = await apiClient.patch(`/api/v1/reports/${id}`, payload);
    return normalizeReport(data as Report);
  } catch (err) {
    throw toApiError(err, "שגיאה בעדכון הדוח");
  }
}

/** DELETE /api/v1/reports/:id — delete a report. */
export async function deleteReport(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/v1/reports/${id}`);
  } catch (err) {
    throw toApiError(err, "שגיאה במחיקת הדוח");
  }
}

/** Fetch the user's latest report with full content. */
export async function fetchLatestReport(): Promise<Report | null> {
  // Step 1: get the most recent report ID from the list endpoint
  // API already sorts by createdAt desc by default
  try {
    const { data: listJson } = await apiClient.get("/api/v1/reports?limit=1");
    const reports = parseReportsList(listJson);
    const first = reports[0];
    if (!first) return null;

    const id = first.id || first._id;
    if (!id) return null;

    const { data: detailJson } = await apiClient.get(`/api/v1/reports/${id}`);
    return normalizeReport(detailJson as Report);
  } catch {
    return null;
  }
}

/**
 * GET /api/v1/reports/archive/yesterday — fetch yesterday's aggregated
 * energy production + peak-hour weather. Used by the report's "archive"
 * stepper section. Returns `null` on transport-level failure; `hasData`
 * on the payload signals upstream-data availability for the empty state.
 */
export async function fetchYesterdayArchive(): Promise<ArchiveData | null> {
  try {
    const { data } = await apiClient.get("/api/v1/reports/archive/yesterday");
    return data as ArchiveData;
  } catch {
    return null;
  }
}

/**
 * Fetch the same calendar day one year ago, for the report's archive
 * year-over-year comparison panel.
 */
export async function fetchLastYearArchive(): Promise<LastYearArchiveData | null> {
  try {
    const { data } = await apiClient.get("/api/v1/reports/archive/last-year");
    return data as LastYearArchiveData;
  } catch {
    return null;
  }
}

// Re-export ApiError so existing imports from "@/lib/api" keep working.
export type { ApiError } from "@/lib/apiClient";
