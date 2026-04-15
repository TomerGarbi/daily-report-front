/**
 * users-api.ts
 *
 * URL builders and mutation helpers for the /users endpoints.
 */

import type { UserRole } from "@/types/user";

// ─── URL builder ──────────────────────────────────────────────────────────────

export interface UsersQueryParams {
  role?: UserRole;
  group?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function buildUsersUrl(params: UsersQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.role)              q.set("role", params.role);
  if (params.group)             q.set("group", params.group);
  if (params.search)            q.set("search", params.search);
  if (params.page != null)      q.set("page", String(params.page));
  if (params.limit != null)     q.set("limit", String(params.limit));
  return `/api/v1/users?${q.toString()}`;
}

export const USERS_STATS_URL = "/api/v1/users/stats";

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateUser(
  userId: string,
  updates: { role?: UserRole; groups?: string[] },
  authFetch: (input: string | URL, init?: RequestInit) => Promise<Response>,
) {
  const res = await authFetch(`/api/v1/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to update user");
  }
  return res.json();
}

export async function deleteUser(
  userId: string,
  authFetch: (input: string | URL, init?: RequestInit) => Promise<Response>,
) {
  const res = await authFetch(`/api/v1/users/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to delete user");
  }
}
