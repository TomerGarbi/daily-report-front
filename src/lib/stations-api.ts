/**
 * stations-api.ts
 *
 * URL builders, response normalizers, and mutation helpers for the
 * /stations and /stations/:id/units endpoints.
 *
 * All requests go through the shared `apiClient` (axios) — auth, refresh,
 * and request-id headers are handled by its interceptors.
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
import { apiClient, toApiError } from "@/lib/apiClient";

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

/**
 * Fetch the full station catalog (or a filtered slice). Used by callers
 * that need the data eagerly outside of the SWR hook (e.g. seeding a new
 * report from the catalog).
 */
export async function fetchStations(
  params: StationsQueryParams = {},
): Promise<Station[]> {
  try {
    const { data } = await apiClient.get(buildStationsUrl({ limit: 200, ...params }));
    return parseStationsList(data).data;
  } catch (err) {
    throw toApiError(err, "שגיאה בטעינת קטלוג התחנות");
  }
}

export async function createStation(payload: CreateStationPayload): Promise<Station> {
  try {
    const { data } = await apiClient.post("/api/v1/stations", payload);
    return normalizeStation(data as Station);
  } catch (err) {
    throw toApiError(err, "שגיאה ביצירת תחנה");
  }
}

export async function updateStation(
  id: string,
  payload: UpdateStationPayload,
): Promise<Station> {
  try {
    const { data } = await apiClient.patch(`/api/v1/stations/${id}`, payload);
    return normalizeStation(data as Station);
  } catch (err) {
    throw toApiError(err, "שגיאה בעדכון תחנה");
  }
}

export async function deleteStation(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/v1/stations/${id}`);
  } catch (err) {
    throw toApiError(err, "שגיאה במחיקת תחנה");
  }
}

export async function addUnit(
  stationId: string,
  payload: UnitPayload,
): Promise<Station> {
  try {
    const { data } = await apiClient.post(
      `/api/v1/stations/${stationId}/units`,
      payload,
    );
    return normalizeStation(data as Station);
  } catch (err) {
    throw toApiError(err, "שגיאה בהוספת יחידה");
  }
}

export async function updateUnit(
  stationId: string,
  unitId: string,
  payload: Partial<UnitPayload>,
): Promise<Station> {
  try {
    const { data } = await apiClient.patch(
      `/api/v1/stations/${stationId}/units/${unitId}`,
      payload,
    );
    return normalizeStation(data as Station);
  } catch (err) {
    throw toApiError(err, "שגיאה בעדכון יחידה");
  }
}

export async function removeUnit(
  stationId: string,
  unitId: string,
): Promise<Station> {
  try {
    const { data } = await apiClient.delete(
      `/api/v1/stations/${stationId}/units/${unitId}`,
    );
    return normalizeStation(data as Station);
  } catch (err) {
    throw toApiError(err, "שגיאה במחיקת יחידה");
  }
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
