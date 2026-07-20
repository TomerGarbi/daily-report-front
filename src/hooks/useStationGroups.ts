/**
 * useStationGroups.ts
 *
 * SWR-powered hooks for the station-group catalog. Mirrors `useStations.ts`.
 */

import { useMemo, useCallback } from "react";
import { useSWRConfig } from "swr";
import type {
  StationGroup,
  StationGroupsListResponse,
  CreateStationGroupPayload,
  UpdateStationGroupPayload,
} from "@/types/stationGroup";
import {
  buildStationGroupsUrl,
  parseStationGroupsList,
  normalizeStationGroup,
  createStationGroup as apiCreateStationGroup,
  updateStationGroup as apiUpdateStationGroup,
  deleteStationGroup as apiDeleteStationGroup,
  type StationGroupsQueryParams,
} from "@/lib/station-groups-api";
import { useAuthSWR } from "@/hooks/useAuthSWR";

// ─── useStationGroups ─────────────────────────────────────────────────────────

export interface UseStationGroupsReturn {
  groups: StationGroup[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | undefined;
}

export function useStationGroups(params: StationGroupsQueryParams = {}): UseStationGroupsReturn {
  const url = useMemo(
    () => buildStationGroupsUrl(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.type, params.search, params.page, params.limit],
  );

  const { data, isLoading, error } = useAuthSWR<unknown>(url);

  const parsed: StationGroupsListResponse = useMemo(
    () =>
      data !== undefined
        ? parseStationGroupsList(data)
        : { data: [], total: 0, page: 1, limit: 200, totalPages: 1, hasNextPage: false },
    [data],
  );

  return {
    groups:      parsed.data,
    total:       parsed.total,
    page:        parsed.page,
    totalPages:  parsed.totalPages,
    hasNextPage: parsed.hasNextPage,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useStationGroup (single) ─────────────────────────────────────────────────

export function useStationGroup(id: string | null) {
  const { data, isLoading, error } = useAuthSWR<StationGroup>(
    id ? `/api/v1/station-groups/${id}` : null,
  );
  return {
    group: data ? normalizeStationGroup(data) : null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useStationGroupMutations ─────────────────────────────────────────────────

export interface UseStationGroupMutationsReturn {
  createStationGroup: (payload: CreateStationGroupPayload) => Promise<StationGroup>;
  updateStationGroup: (id: string, payload: UpdateStationGroupPayload) => Promise<StationGroup>;
  deleteStationGroup: (id: string) => Promise<void>;
}

export function useStationGroupMutations(): UseStationGroupMutationsReturn {
  const { mutate: globalMutate } = useSWRConfig();

  const invalidate = useCallback(() => {
    // Group changes may affect station listings too (e.g. renamed group
    // appears in the stations table's group column).
    globalMutate(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("/api/v1/station-groups") || key.startsWith("/api/v1/stations")),
      undefined,
      { revalidate: true },
    );
  }, [globalMutate]);

  return {
    createStationGroup: useCallback(async (payload) => {
      const g = await apiCreateStationGroup(payload);
      invalidate();
      return g;
    }, [invalidate]),

    updateStationGroup: useCallback(async (id, payload) => {
      const g = await apiUpdateStationGroup(id, payload);
      invalidate();
      return g;
    }, [invalidate]),

    deleteStationGroup: useCallback(async (id) => {
      await apiDeleteStationGroup(id);
      invalidate();
    }, [invalidate]),
  };
}
