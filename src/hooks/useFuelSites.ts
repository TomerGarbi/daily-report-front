/**
 * useFuelSites.ts
 *
 * SWR-powered hooks for the fuel-site catalog. Mirrors `useStations.ts`.
 */

import { useMemo, useCallback } from "react";
import { useSWRConfig } from "swr";
import type {
  FuelSite,
  FuelSitesListResponse,
  CreateFuelSitePayload,
  UpdateFuelSitePayload,
  TankPayload,
} from "@/types/fuelSite";
import {
  buildFuelSitesUrl,
  parseFuelSitesList,
  normalizeFuelSite,
  createFuelSite as apiCreate,
  updateFuelSite as apiUpdate,
  deleteFuelSite as apiDelete,
  addTank        as apiAddTank,
  updateTank     as apiUpdateTank,
  removeTank     as apiRemoveTank,
  type FuelSitesQueryParams,
} from "@/lib/fuel-sites-api";
import { useAuthSWR } from "@/hooks/useAuthSWR";
import { useAuthFetch } from "@/hooks/useAuthFetch";

// ─── useFuelSites ─────────────────────────────────────────────────────────────

export interface UseFuelSitesReturn {
  sites: FuelSite[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | undefined;
}

export function useFuelSites(params: FuelSitesQueryParams = {}): UseFuelSitesReturn {
  const url = useMemo(
    () => buildFuelSitesUrl(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.fuel, params.search, params.page, params.limit],
  );

  const { data, isLoading, error } = useAuthSWR<unknown>(url);

  const parsed: FuelSitesListResponse = useMemo(
    () =>
      data !== undefined
        ? parseFuelSitesList(data)
        : { data: [], total: 0, page: 1, limit: 50, totalPages: 1, hasNextPage: false },
    [data],
  );

  return {
    sites:       parsed.data,
    total:       parsed.total,
    page:        parsed.page,
    totalPages:  parsed.totalPages,
    hasNextPage: parsed.hasNextPage,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useFuelSite (single) ─────────────────────────────────────────────────────

export function useFuelSite(id: string | null) {
  const { data, isLoading, error } = useAuthSWR<FuelSite>(
    id ? `/api/v1/fuel-sites/${id}` : null,
  );
  return {
    site: data ? normalizeFuelSite(data) : null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─── useFuelSiteMutations ─────────────────────────────────────────────────────

export interface UseFuelSiteMutationsReturn {
  createFuelSite: (payload: CreateFuelSitePayload) => Promise<FuelSite>;
  updateFuelSite: (id: string, payload: UpdateFuelSitePayload) => Promise<FuelSite>;
  deleteFuelSite: (id: string) => Promise<void>;
  addTank:        (siteId: string, payload: TankPayload) => Promise<FuelSite>;
  updateTank:     (siteId: string, tankId: string, payload: Partial<TankPayload>) => Promise<FuelSite>;
  removeTank:     (siteId: string, tankId: string) => Promise<FuelSite>;
}

export function useFuelSiteMutations(): UseFuelSiteMutationsReturn {
  const authFetch = useAuthFetch();
  const { mutate: globalMutate } = useSWRConfig();

  const invalidate = useCallback(() => {
    globalMutate(
      (key) => typeof key === "string" && key.startsWith("/api/v1/fuel-sites"),
      undefined,
      { revalidate: true },
    );
  }, [globalMutate]);

  return {
    createFuelSite: useCallback(async (payload) => {
      const s = await apiCreate(authFetch, payload);
      invalidate();
      return s;
    }, [authFetch, invalidate]),

    updateFuelSite: useCallback(async (id, payload) => {
      const s = await apiUpdate(authFetch, id, payload);
      invalidate();
      return s;
    }, [authFetch, invalidate]),

    deleteFuelSite: useCallback(async (id) => {
      await apiDelete(authFetch, id);
      invalidate();
    }, [authFetch, invalidate]),

    addTank: useCallback(async (siteId, payload) => {
      const s = await apiAddTank(authFetch, siteId, payload);
      invalidate();
      return s;
    }, [authFetch, invalidate]),

    updateTank: useCallback(async (siteId, tankId, payload) => {
      const s = await apiUpdateTank(authFetch, siteId, tankId, payload);
      invalidate();
      return s;
    }, [authFetch, invalidate]),

    removeTank: useCallback(async (siteId, tankId) => {
      const s = await apiRemoveTank(authFetch, siteId, tankId);
      invalidate();
      return s;
    }, [authFetch, invalidate]),
  };
}
