import { useMemo, useCallback } from "react";
import { useSWRConfig } from "swr";
import type { UserEntry, UserListResponse, UserStats, UserRole } from "@/types/user";
import { buildUsersUrl, USERS_STATS_URL, type UsersQueryParams } from "@/lib/users-api";
import { updateUser, deleteUser } from "@/lib/users-api";
import { useAuthSWR } from "@/hooks/useAuthSWR";
import { useAuthFetch } from "@/hooks/useAuthFetch";

// ─── useUsers ─────────────────────────────────────────────────────────────────

export interface UseUsersReturn {
  users: UserEntry[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | undefined;
}

export function useUsers(params: UsersQueryParams = {}): UseUsersReturn {
  const url = useMemo(() => buildUsersUrl(params), [
    params.role,
    params.group,
    params.search,
    params.page,
    params.limit,
  ]);

  const { data, isLoading, error } = useAuthSWR<UserListResponse>(url);

  return {
    users: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNextPage: data?.hasNextPage ?? false,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useUserStats ─────────────────────────────────────────────────────────────

export interface UseUserStatsReturn {
  stats: UserStats | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useUserStats(): UseUserStatsReturn {
  const { data, isLoading, error } = useAuthSWR<UserStats>(USERS_STATS_URL);

  return {
    stats: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useUserMutations ─────────────────────────────────────────────────────────

export function useUserMutations() {
  const authFetch = useAuthFetch();
  const { mutate } = useSWRConfig();

  const revalidate = useCallback(() => {
    // Revalidate all user list & stats SWR keys
    mutate((key: unknown) => typeof key === "string" && key.startsWith("/api/v1/users"), undefined, { revalidate: true });
  }, [mutate]);

  const patchUser = useCallback(
    async (userId: string, updates: { role?: UserRole; groups?: string[] }) => {
      const result = await updateUser(userId, updates, authFetch);
      revalidate();
      return result;
    },
    [authFetch, revalidate],
  );

  const removeUser = useCallback(
    async (userId: string) => {
      await deleteUser(userId, authFetch);
      revalidate();
    },
    [authFetch, revalidate],
  );

  return { patchUser, removeUser };
}
