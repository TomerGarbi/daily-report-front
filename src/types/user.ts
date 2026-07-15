export type UserRole = "guest" | "user" | "manager" | "admin";

/** Buckets recognized by the users list filter + stats endpoints. */
export type UserStatus = "active" | "dormant" | "disabled" | "neverLoggedIn";

/** Sort keys accepted by the users list endpoint. */
export type UserSortField =
  | "username"
  | "lastLoginAt"
  | "lastActivityAt"
  | "createdAt";

export interface UserGroup {
  _id: string;
  name: string;
}

export interface UserEntry {
  _id: string;
  username: string;
  role: UserRole;
  groups: UserGroup[];
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp of the last successful login. Absent for legacy users. */
  lastLoginAt?: string;
  /** IP address recorded at the last successful login. */
  lastLoginIp?: string;
  /** ISO timestamp of the last authenticated request (throttled to ~5 min). */
  lastActivityAt?: string;
  /** Total successful logins. */
  loginCount?: number;
  /** Failed login attempts since the last success. Reset on success. */
  failedLoginCount?: number;
  /** Soft-disabled — login rejected but the record is retained. */
  disabled?: boolean;
}

export interface UserListResponse {
  data: UserEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface UserStats {
  total: number;
  byRole: Record<UserRole, number>;
  byGroup: { group: string; groupId: string; count: number }[];
  recent: {
    last7Days: number;
    last30Days: number;
  };
  activity?: {
    activeNow: number;
    activeToday: number;
    dormant: number;
    disabled: number;
    neverLoggedIn: number;
  };
}
