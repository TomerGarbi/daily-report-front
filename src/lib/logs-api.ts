/**
 * logs-api.ts
 *
 * Pure API helpers for the /logs endpoints.
 */

import type { LogLevel } from "@/types/log";

// ─── URL builder ──────────────────────────────────────────────────────────────

export interface LogsQueryParams {
  level?: LogLevel;
  user?: string;
  context?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function buildLogsUrl(params: LogsQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.level)   q.set("level", params.level);
  if (params.user)    q.set("user", params.user);
  if (params.context) q.set("context", params.context);
  if (params.search)  q.set("search", params.search);
  if (params.from)    q.set("from", params.from);
  if (params.to)      q.set("to", params.to);
  if (params.page != null)  q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  return `/api/v1/logs?${q.toString()}`;
}

export const LOGS_STATS_URL = "/api/v1/logs/stats";
