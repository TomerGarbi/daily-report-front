/**
 * Types for the audit event surface. Mirrors `IAuditEvent` on the backend
 * (see `daily-report-api/models/AuditEvent.ts`).
 */

export type AuditOutcome = "success" | "failure";

/**
 * Machine-readable action key. Kept as a `string` union hint of the
 * currently-recorded actions — extend as new controllers wire audit calls.
 * Consumers should still tolerate unknown values (e.g. from older records
 * or new backend versions) so we widen the type back to `string` at the end.
 */
export type KnownAuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.permission.denied"
  | "user.role.change"
  | "user.groups.change"
  | "user.disable"
  | "user.enable"
  | "user.delete"
  | "report.create"
  | "report.update"
  | "report.publish"
  | "report.delete"
  | "station.create"
  | "station.update"
  | "station.delete"
  | "fuelSite.create"
  | "fuelSite.update"
  | "fuelSite.delete";

export type AuditAction = KnownAuditAction | (string & {});

export type AuditResourceType =
  | "user"
  | "report"
  | "station"
  | "fuelSite"
  | "route"
  | (string & {});

export interface AuditEvent {
  _id: string;
  timestamp: string;
  actor: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceLabel?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  outcome: AuditOutcome;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditListResponse {
  data: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface AuditStatsResponse {
  last24h: number;
  last7d: number;
  failures: number;
  topActions: { action: string; count: number }[];
  topActors:  { actor: string;  count: number }[];
}
