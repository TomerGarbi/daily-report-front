/**
 * api.ts
 *
 * Typed API helpers: URL builders, response parsers, and mutation functions.
 * Pure functions — they don't know about auth or React.
 * Mutation functions receive a pre-bound `authFetch` and return typed data.
 */

import { Report, ReportStatus, ReportContent, ArchiveData, LastYearArchiveData } from "@/types/report";

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

export interface ApiError extends Error {
  status?: number;
  body?: Record<string, unknown>;
}

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
// These accept the authFetch function so they stay decoupled from React hooks.

type AuthFetchFn = (input: string | URL, init?: RequestInit) => Promise<Response>;

function createApiError(message: string, status?: number, body?: Record<string, unknown>): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.body = body;
  return err;
}

/** POST /api/v1/reports — create a new report. */
export async function createReport(
  authFetch: AuthFetchFn,
  payload: CreateReportPayload,
): Promise<Report> {
  const res = await authFetch("/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw createApiError(
      (body as { message?: string }).message ?? `שגיאה ביצירת הדוח (${res.status})`,
      res.status,
      body as Record<string, unknown>,
    );
  }

  const json = await res.json();
  return normalizeReport(json as Report);
}

/** PATCH /api/v1/reports/:id — update an existing report. */
export async function updateReport(
  authFetch: AuthFetchFn,
  id: string,
  payload: UpdateReportPayload,
): Promise<Report> {
  const res = await authFetch(`/api/v1/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw createApiError(
      (body as { message?: string }).message ?? `שגיאה בעדכון הדוח (${res.status})`,
      res.status,
      body as Record<string, unknown>,
    );
  }

  const json = await res.json();
  return normalizeReport(json as Report);
}

/** DELETE /api/v1/reports/:id — delete a report. */
export async function deleteReport(
  authFetch: AuthFetchFn,
  id: string,
): Promise<void> {
  const res = await authFetch(`/api/v1/reports/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw createApiError(
      (body as { message?: string }).message ?? `שגיאה במחיקת הדוח (${res.status})`,
      res.status,
      body as Record<string, unknown>,
    );
  }
}

/** Fetch the user's latest report with full content. */
export async function fetchLatestReport(
  authFetch: AuthFetchFn,
): Promise<Report | null> {
  // Step 1: get the most recent report ID from the list endpoint
  // API already sorts by createdAt desc by default
  const listRes = await authFetch("/api/v1/reports?limit=1");
  if (!listRes.ok) return null;
  const listJson = await listRes.json();
  const reports = parseReportsList(listJson);
  if (reports.length === 0) return null;

  // Step 2: fetch the full report (with content) by ID
  const id = reports[0].id || reports[0]._id;
  if (!id) return null;
  const detailRes = await authFetch(`/api/v1/reports/${id}`);
  if (!detailRes.ok) return null;
  const detailJson = await detailRes.json();
  return normalizeReport(detailJson as Report);
}

/**
 * GET /api/v1/reports/archive/yesterday — fetch yesterday's aggregated
 * energy production + peak-hour weather. Used by the report's "archive"
 * stepper section. Returns `null` on transport-level failure; `hasData`
 * on the payload signals upstream-data availability for the empty state.
 */
export async function fetchYesterdayArchive(
  authFetch: AuthFetchFn,
): Promise<ArchiveData | null> {
  const res = await authFetch("/api/v1/reports/archive/yesterday");
  if (!res.ok) return null;
  const json = await res.json();
  return json as ArchiveData;
}

/**
 * Fetch the same calendar day one year ago, for the report's archive
 * year-over-year comparison panel.
 */
export async function fetchLastYearArchive(
  authFetch: AuthFetchFn,
): Promise<LastYearArchiveData | null> {
  const res = await authFetch("/api/v1/reports/archive/last-year");
  if (!res.ok) return null;
  const json = await res.json();
  return json as LastYearArchiveData;
}


