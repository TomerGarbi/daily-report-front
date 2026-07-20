/**
 * useStations.ts
 *
 * SWR-powered hooks for the station / unit catalog.
 * Mirrors the shape of `useReports.ts` and `useUsers.ts`.
 */

import { useMemo, useCallback } from "react";
import { useSWRConfig } from "swr";
import type {
  Station,
  StationsListResponse,
  CreateStationPayload,
  UpdateStationPayload,
  UnitPayload,
} from "@/types/station";
import {
  buildStationsUrl,
  parseStationsList,
  normalizeStation,
  createStation as apiCreateStation,
  updateStation as apiUpdateStation,
  deleteStation as apiDeleteStation,
  addUnit       as apiAddUnit,
  updateUnit    as apiUpdateUnit,
  removeUnit    as apiRemoveUnit,
  type StationsQueryParams,
} from "@/lib/stations-api";
import { useAuthSWR } from "@/hooks/useAuthSWR";

// ─── useStations ──────────────────────────────────────────────────────────────

export interface UseStationsReturn {
  stations: Station[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | undefined;
}

export function useStations(params: StationsQueryParams = {}): UseStationsReturn {
  const url = useMemo(
    () => buildStationsUrl(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.type, params.fuel, params.groupId, params.search, params.page, params.limit],
  );

  const { data, isLoading, error } = useAuthSWR<unknown>(url);

  const parsed: StationsListResponse = useMemo(
    () =>
      data !== undefined
        ? parseStationsList(data)
        : { data: [], total: 0, page: 1, limit: 50, totalPages: 1, hasNextPage: false },
    [data],
  );

  return {
    stations:    parsed.data,
    total:       parsed.total,
    page:        parsed.page,
    totalPages:  parsed.totalPages,
    hasNextPage: parsed.hasNextPage,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useStation (single) ──────────────────────────────────────────────────────

export function useStation(id: string | null) {
  const { data, isLoading, error } = useAuthSWR<Station>(
    id ? `/api/v1/stations/${id}` : null,
  );

  return {
    station: data ? normalizeStation(data) : null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useStationMutations ──────────────────────────────────────────────────────

export interface UseStationMutationsReturn {
  createStation: (payload: CreateStationPayload) => Promise<Station>;
  updateStation: (id: string, payload: UpdateStationPayload) => Promise<Station>;
  deleteStation: (id: string) => Promise<void>;
  addUnit:       (stationId: string, payload: UnitPayload) => Promise<Station>;
  updateUnit:    (stationId: string, unitId: string, payload: Partial<UnitPayload>) => Promise<Station>;
  removeUnit:    (stationId: string, unitId: string) => Promise<Station>;
}

export function useStationMutations(): UseStationMutationsReturn {
  const { mutate: globalMutate } = useSWRConfig();

  const invalidate = useCallback(() => {
    globalMutate(
      (key) => typeof key === "string" && key.startsWith("/api/v1/stations"),
      undefined,
      { revalidate: true },
    );
  }, [globalMutate]);

  return {
    createStation: useCallback(async (payload) => {
      const s = await apiCreateStation(payload);
      invalidate();
      return s;
    }, [invalidate]),

    updateStation: useCallback(async (id, payload) => {
      const s = await apiUpdateStation(id, payload);
      invalidate();
      return s;
    }, [invalidate]),

    deleteStation: useCallback(async (id) => {
      await apiDeleteStation(id);
      invalidate();
    }, [invalidate]),

    addUnit: useCallback(async (stationId, payload) => {
      const s = await apiAddUnit(stationId, payload);
      invalidate();
      return s;
    }, [invalidate]),

    updateUnit: useCallback(async (stationId, unitId, payload) => {
      const s = await apiUpdateUnit(stationId, unitId, payload);
      invalidate();
      return s;
    }, [invalidate]),

    removeUnit: useCallback(async (stationId, unitId) => {
      const s = await apiRemoveUnit(stationId, unitId);
      invalidate();
      return s;
    }, [invalidate]),
  };
}
