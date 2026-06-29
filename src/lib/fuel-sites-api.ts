/**
 * fuel-sites-api.ts
 *
 * URL builders, response normalizers, and mutation helpers for the
 * /fuel-sites endpoints. Mirrors `stations-api.ts`.
 */

import type {
  FuelSite,
  FuelSitesListResponse,
  CreateFuelSitePayload,
  UpdateFuelSitePayload,
  TankPayload,
} from "@/types/fuelSite";
import type { StationFuel } from "@/types/station";

type AuthFetchFn = (input: string | URL, init?: RequestInit) => Promise<Response>;

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

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  const msg = (body as { message?: string }).message ?? `${fallback} (${res.status})`;
  return new Error(msg);
}

export async function fetchFuelSites(
  authFetch: AuthFetchFn,
  params: FuelSitesQueryParams = {},
): Promise<FuelSite[]> {
  const res = await authFetch(buildFuelSitesUrl({ limit: 200, ...params }));
  if (!res.ok) throw await parseError(res, "שגיאה בטעינת קטלוג אתרי הדלק");
  return parseFuelSitesList(await res.json()).data;
}

export async function createFuelSite(
  authFetch: AuthFetchFn,
  payload: CreateFuelSitePayload,
): Promise<FuelSite> {
  const res = await authFetch("/api/v1/fuel-sites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה ביצירת אתר דלק");
  return normalizeFuelSite((await res.json()) as FuelSite);
}

export async function updateFuelSite(
  authFetch: AuthFetchFn,
  id: string,
  payload: UpdateFuelSitePayload,
): Promise<FuelSite> {
  const res = await authFetch(`/api/v1/fuel-sites/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה בעדכון אתר דלק");
  return normalizeFuelSite((await res.json()) as FuelSite);
}

export async function deleteFuelSite(
  authFetch: AuthFetchFn,
  id: string,
): Promise<void> {
  const res = await authFetch(`/api/v1/fuel-sites/${id}`, { method: "DELETE" });
  if (!res.ok) throw await parseError(res, "שגיאה במחיקת אתר דלק");
}

export async function addTank(
  authFetch: AuthFetchFn,
  siteId: string,
  payload: TankPayload,
): Promise<FuelSite> {
  const res = await authFetch(`/api/v1/fuel-sites/${siteId}/tanks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה בהוספת מיכל");
  return normalizeFuelSite((await res.json()) as FuelSite);
}

export async function updateTank(
  authFetch: AuthFetchFn,
  siteId: string,
  tankId: string,
  payload: Partial<TankPayload>,
): Promise<FuelSite> {
  const res = await authFetch(`/api/v1/fuel-sites/${siteId}/tanks/${tankId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה בעדכון מיכל");
  return normalizeFuelSite((await res.json()) as FuelSite);
}

export async function removeTank(
  authFetch: AuthFetchFn,
  siteId: string,
  tankId: string,
): Promise<FuelSite> {
  const res = await authFetch(`/api/v1/fuel-sites/${siteId}/tanks/${tankId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseError(res, "שגיאה במחיקת מיכל");
  return normalizeFuelSite((await res.json()) as FuelSite);
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
