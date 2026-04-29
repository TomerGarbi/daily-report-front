/**
 * stations-api.ts
 *
 * URL builders, response normalizers, and mutation helpers for the
 * /stations and /stations/:id/units endpoints.
 *
 * Mirrors the conventions used by `users-api.ts` and `lib/api.ts`.
 */

import type {
  Station,
  StationType,
  StationFuel,
  StationsListResponse,
  CreateStationPayload,
  UpdateStationPayload,
  UnitPayload,
} from "@/types/station";

type AuthFetchFn = (input: string | URL, init?: RequestInit) => Promise<Response>;

// ─── URL builders ─────────────────────────────────────────────────────────────

export interface StationsQueryParams {
  type?: StationType;
  fuel?: StationFuel;
  search?: string;
  page?: number;
  limit?: number;
}

export function buildStationsUrl(params: StationsQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.type)         q.set("type",  params.type);
  if (params.fuel)         q.set("fuel",  params.fuel);
  if (params.search)       q.set("search", params.search);
  if (params.page  != null) q.set("page",  String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  return `/api/v1/stations?${q.toString()}`;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

export function normalizeStation(raw: Station): Station {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? "",
    units: (raw.units ?? []).map((u) => ({ ...u, id: u.id ?? u._id ?? "" })),
  };
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  const msg = (body as { message?: string }).message ?? `${fallback} (${res.status})`;
  return new Error(msg);
}

/**
 * Fetch the full station catalog (or a filtered slice). Used by callers
 * that need the data eagerly outside of the SWR hook (e.g. seeding a new
 * report from the catalog).
 */
export async function fetchStations(
  authFetch: AuthFetchFn,
  params: StationsQueryParams = {},
): Promise<Station[]> {
  const res = await authFetch(buildStationsUrl({ limit: 200, ...params }));
  if (!res.ok) throw await parseError(res, "שגיאה בטעינת קטלוג התחנות");
  return parseStationsList(await res.json()).data;
}

export async function createStation(
  authFetch: AuthFetchFn,
  payload: CreateStationPayload,
): Promise<Station> {
  const res = await authFetch("/api/v1/stations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה ביצירת תחנה");
  return normalizeStation((await res.json()) as Station);
}

export async function updateStation(
  authFetch: AuthFetchFn,
  id: string,
  payload: UpdateStationPayload,
): Promise<Station> {
  const res = await authFetch(`/api/v1/stations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה בעדכון תחנה");
  return normalizeStation((await res.json()) as Station);
}

export async function deleteStation(
  authFetch: AuthFetchFn,
  id: string,
): Promise<void> {
  const res = await authFetch(`/api/v1/stations/${id}`, { method: "DELETE" });
  if (!res.ok) throw await parseError(res, "שגיאה במחיקת תחנה");
}

export async function addUnit(
  authFetch: AuthFetchFn,
  stationId: string,
  payload: UnitPayload,
): Promise<Station> {
  const res = await authFetch(`/api/v1/stations/${stationId}/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה בהוספת יחידה");
  return normalizeStation((await res.json()) as Station);
}

export async function updateUnit(
  authFetch: AuthFetchFn,
  stationId: string,
  unitId: string,
  payload: Partial<UnitPayload>,
): Promise<Station> {
  const res = await authFetch(`/api/v1/stations/${stationId}/units/${unitId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res, "שגיאה בעדכון יחידה");
  return normalizeStation((await res.json()) as Station);
}

export async function removeUnit(
  authFetch: AuthFetchFn,
  stationId: string,
  unitId: string,
): Promise<Station> {
  const res = await authFetch(`/api/v1/stations/${stationId}/units/${unitId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseError(res, "שגיאה במחיקת יחידה");
  return normalizeStation((await res.json()) as Station);
}

// ─── Response shape helper (used by the SWR hook) ─────────────────────────────

export function parseStationsList(json: unknown): StationsListResponse {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    const list = (obj.data ?? []) as Station[];
    return {
      data:        list.map(normalizeStation),
      total:       typeof obj.total       === "number"  ? obj.total       : list.length,
      page:        typeof obj.page        === "number"  ? obj.page        : 1,
      limit:       typeof obj.limit       === "number"  ? obj.limit       : list.length,
      totalPages:  typeof obj.totalPages  === "number"  ? obj.totalPages  : 1,
      hasNextPage: typeof obj.hasNextPage === "boolean" ? obj.hasNextPage : false,
    };
  }
  const list = Array.isArray(json) ? (json as Station[]).map(normalizeStation) : [];
  return { data: list, total: list.length, page: 1, limit: list.length, totalPages: 1, hasNextPage: false };
}
