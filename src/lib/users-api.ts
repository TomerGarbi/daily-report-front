/**
 * users-api.ts
 *
 * URL builders and mutation helpers for the /users endpoints.
 * All requests go through the shared `apiClient` (axios) — auth, refresh,
 * and request-id headers are handled by its interceptors.
 */

import type { UserRole, UserStatus, UserSortField } from "@/types/user";
import { apiClient, toApiError } from "@/lib/apiClient";

// ─── URL builder ──────────────────────────────────────────────────────────────

export interface UsersQueryParams {
  role?: UserRole;
  group?: string;
  search?: string;
  status?: UserStatus;
  sort?: UserSortField;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export function buildUsersUrl(params: UsersQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.role)              q.set("role", params.role);
  if (params.group)             q.set("group", params.group);
  if (params.search)            q.set("search", params.search);
  if (params.status)            q.set("status", params.status);
  if (params.sort)              q.set("sort", params.sort);
  if (params.order)             q.set("order", params.order);
  if (params.page != null)      q.set("page", String(params.page));
  if (params.limit != null)     q.set("limit", String(params.limit));
  return `/api/v1/users?${q.toString()}`;
}

export const USERS_STATS_URL = "/api/v1/users/stats";

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateUser(
  userId: string,
  updates: { role?: UserRole; groups?: string[]; disabled?: boolean },
) {
  try {
    const { data } = await apiClient.patch(`/api/v1/users/${userId}`, updates);
    return data;
  } catch (err) {
    throw toApiError(err, "Failed to update user");
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/v1/users/${userId}`);
  } catch (err) {
    throw toApiError(err, "Failed to delete user");
  }
}
