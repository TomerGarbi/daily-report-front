/**
 * useAuditEvents.ts
 *
 * SWR-backed hooks for the audit endpoints. The activity feed uses a short
 * polling interval so admins see fresh events without manual refresh; the
 * user-timeline hook fetches on-demand for the drawer.
 */

import { useMemo } from "react";
import type { AuditEvent, AuditListResponse, AuditStatsResponse } from "@/types/audit";
import { AUDIT_STATS_URL, buildAuditUrl, buildUserTimelineUrl, type AuditQueryParams } from "@/lib/audit-api";
import { useAuthSWR } from "@/hooks/useAuthSWR";

// ─── useAuditEvents ──────────────────────────────────────────────────────────

export interface UseAuditEventsOptions extends AuditQueryParams {
  /** When true, poll the endpoint every `refreshIntervalMs` (default 15 s). */
  live?: boolean;
  refreshIntervalMs?: number;
}

export interface UseAuditEventsReturn {
  events: AuditEvent[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | undefined;
}

export function useAuditEvents(opts: UseAuditEventsOptions = {}): UseAuditEventsReturn {
  const { live, refreshIntervalMs, ...params } = opts;
  const url = useMemo(() => buildAuditUrl(params), [
    params.actor, params.action, params.resourceType, params.resourceId,
    params.outcome, params.requestId, params.from, params.to, params.page, params.limit,
  ]);

  const { data, isLoading, error } = useAuthSWR<AuditListResponse>(
    url,
    live ? { refreshInterval: refreshIntervalMs ?? 15_000 } : undefined,
  );

  return {
    events: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNextPage: data?.hasNextPage ?? false,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useAuditStats ───────────────────────────────────────────────────────────

export function useAuditStats() {
  const { data, isLoading, error } = useAuthSWR<AuditStatsResponse>(AUDIT_STATS_URL);
  return {
    stats: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useUserAuditTimeline ────────────────────────────────────────────────────

/**
 * Fetches the recent audit events for a single actor. Used by the user
 * detail drawer's "activity" tab. Passing `null` skips the request.
 */
export function useUserAuditTimeline(username: string | null, limit = 100) {
  const url = username ? buildUserTimelineUrl(username, limit) : null;
  const { data, isLoading, error } = useAuthSWR<{ data: AuditEvent[]; total: number }>(url);
  return {
    events: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error as Error | undefined,
  };
}
