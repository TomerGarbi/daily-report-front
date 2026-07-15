/**
 * fuel-sites-api.ts
 *
 * URL builders, response normalizers, and mutation helpers for the
 * /fuel-sites endpoints. Mirrors `stations-api.ts`.
 *
 * All requests go through the shared `apiClient` (axios) — auth, refresh,
 * and request-id headers are handled by its interceptors.
 */

import type {
  FuelSite,
  FuelSitesListResponse,
  CreateFuelSitePayload,
  UpdateFuelSitePayload,
  TankPayload,
} from "@/types/fuelSite";
import type { StationFuel } from "@/types/station";
import { apiClient, toApiError } from "@/lib/apiClient";

export interface FuelSitesQueryParams {
  fuel?: StationFuel;
  search?: string;
  page?: number;
  limit?: number;
}

export function buildFuelSitesUrl(params: FuelSitesQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.fuel)         q.set("fuel",  params.fuel);
  if (params.search)       q.set("search", params.search);
  if (params.page  != null) q.set("page",  String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  return `/api/v1/fuel-sites?${q.toString()}`;
}

export function normalizeFuelSite(raw: FuelSite): FuelSite {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? "",
    tanks: (raw.tanks ?? []).map((t) => ({ ...t, id: t.id ?? t._id ?? "" })),
  };
}

export async function fetchFuelSites(
  params: FuelSitesQueryParams = {},
): Promise<FuelSite[]> {
  try {
    const { data } = await apiClient.get(buildFuelSitesUrl({ limit: 200, ...params }));
    return parseFuelSitesList(data).data;
  } catch (err) {
    throw toApiError(err, "שגיאה בטעינת קטלוג אתרי הדלק");
  }
}

export async function createFuelSite(
  payload: CreateFuelSitePayload,
): Promise<FuelSite> {
  try {
    const { data } = await apiClient.post("/api/v1/fuel-sites", payload);
    return normalizeFuelSite(data as FuelSite);
  } catch (err) {
    throw toApiError(err, "שגיאה ביצירת אתר דלק");
  }
}

export async function updateFuelSite(
  id: string,
  payload: UpdateFuelSitePayload,
): Promise<FuelSite> {
  try {
    const { data } = await apiClient.patch(`/api/v1/fuel-sites/${id}`, payload);
    return normalizeFuelSite(data as FuelSite);
  } catch (err) {
    throw toApiError(err, "שגיאה בעדכון אתר דלק");
  }
}

export async function deleteFuelSite(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/v1/fuel-sites/${id}`);
  } catch (err) {
    throw toApiError(err, "שגיאה במחיקת אתר דלק");
  }
}

export async function addTank(
  siteId: string,
  payload: TankPayload,
): Promise<FuelSite> {
  try {
    const { data } = await apiClient.post(
      `/api/v1/fuel-sites/${siteId}/tanks`,
      payload,
    );
    return normalizeFuelSite(data as FuelSite);
  } catch (err) {
    throw toApiError(err, "שגיאה בהוספת מיכל");
  }
}

export async function updateTank(
  siteId: string,
  tankId: string,
  payload: Partial<TankPayload>,
): Promise<FuelSite> {
  try {
    const { data } = await apiClient.patch(
      `/api/v1/fuel-sites/${siteId}/tanks/${tankId}`,
      payload,
    );
    return normalizeFuelSite(data as FuelSite);
  } catch (err) {
    throw toApiError(err, "שגיאה בעדכון מיכל");
  }
}

export async function removeTank(
  siteId: string,
  tankId: string,
): Promise<FuelSite> {
  try {
    const { data } = await apiClient.delete(
      `/api/v1/fuel-sites/${siteId}/tanks/${tankId}`,
    );
    return normalizeFuelSite(data as FuelSite);
  } catch (err) {
    throw toApiError(err, "שגיאה במחיקת מיכל");
  }
}

export function parseFuelSitesList(json: unknown): FuelSitesListResponse {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    const list = (obj.data ?? []) as FuelSite[];
    return {
      data:        list.map(normalizeFuelSite),
      total:       typeof obj.total       === "number"  ? obj.total       : list.length,
      page:        typeof obj.page        === "number"  ? obj.page        : 1,
      limit:       typeof obj.limit       === "number"  ? obj.limit       : list.length,
      totalPages:  typeof obj.totalPages  === "number"  ? obj.totalPages  : 1,
      hasNextPage: typeof obj.hasNextPage === "boolean" ? obj.hasNextPage : false,
    };
  }
  const list = Array.isArray(json) ? (json as FuelSite[]).map(normalizeFuelSite) : [];
  return { data: list, total: list.length, page: 1, limit: list.length, totalPages: 1, hasNextPage: false };
}
