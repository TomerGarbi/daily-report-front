/**
 * api.ts
 *
 * Typed API helpers: URL builders, response parsers, and mutation functions.
 * Pure functions — they don't know about auth or React.
 * Mutation functions receive a pre-bound `authFetch` and return typed data.
 */

import { Report, ReportsResponse, ReportStatus, ReportContent } from "@/types/report";

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
  description?: string;
  group?: string;
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

/** Full SWR fetcher: calls the URL with authFetch, throws on non-OK, returns normalised list. */
export async function reportsFetcher(
  url: string,
  authFetch: (url: string) => Promise<Response>
): Promise<Report[]> {
  const res = await authFetch(url);
  if (!res.ok) {
    const err = new Error(`API error ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  const json: ReportsResponse | Report[] = await res.json();
  return parseReportsList(json);
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
