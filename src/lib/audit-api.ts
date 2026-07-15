/**
 * audit-api.ts
 *
 * URL builders for the /audit endpoints. Mutation-free — the audit trail is
 * write-only from the client's perspective; all writes happen server-side
 * inside controllers via `auditService`.
 */

import type { AuditAction, AuditOutcome, AuditResourceType } from "@/types/audit";

export interface AuditQueryParams {
  actor?:        string;
  action?:       AuditAction;
  resourceType?: AuditResourceType;
  resourceId?:   string;
  outcome?:      AuditOutcome;
  requestId?:    string;
  /** ISO date-time — inclusive lower bound on `timestamp`. */
  from?:         string;
  /** ISO date-time — inclusive upper bound on `timestamp`. */
  to?:           string;
  page?:         number;
  limit?:        number;
}

export function buildAuditUrl(params: AuditQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.actor)        q.set("actor",        params.actor);
  if (params.action)       q.set("action",       params.action);
  if (params.resourceType) q.set("resourceType", params.resourceType);
  if (params.resourceId)   q.set("resourceId",   params.resourceId);
  if (params.outcome)      q.set("outcome",      params.outcome);
  if (params.requestId)    q.set("requestId",    params.requestId);
  if (params.from)         q.set("from",         params.from);
  if (params.to)           q.set("to",           params.to);
  if (params.page  != null) q.set("page",  String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return qs ? `/api/v1/audit?${qs}` : "/api/v1/audit";
}

export const AUDIT_STATS_URL = "/api/v1/audit/stats";

export function buildUserTimelineUrl(username: string, limit = 100): string {
  return `/api/v1/audit/user/${encodeURIComponent(username)}/timeline?limit=${limit}`;
}
