/**
 * station-groups-api.ts
 *
 * URL builders, response normalizers, and mutation helpers for the
 * /station-groups endpoints. Mirrors `stations-api.ts`.
 */

import type {
  StationGroup,
  StationGroupsListResponse,
  CreateStationGroupPayload,
  UpdateStationGroupPayload,
} from "@/types/stationGroup";
import type { StationType } from "@/types/station";
import { apiClient, toApiError } from "@/lib/apiClient";

// ─── URL builders ─────────────────────────────────────────────────────────────

export interface StationGroupsQueryParams {
  type?: StationType;
  search?: string;
  page?: number;
  limit?: number;
}

export function buildStationGroupsUrl(params: StationGroupsQueryParams = {}): string {
  const q = new URLSearchParams();
  if (params.type)          q.set("type",   params.type);
  if (params.search)        q.set("search", params.search);
  if (params.page  != null) q.set("page",   String(params.page));
  if (params.limit != null) q.set("limit",  String(params.limit));
  return `/api/v1/station-groups?${q.toString()}`;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function normalizeStationGroup(raw: StationGroup): StationGroup {
  return { ...raw, id: raw.id ?? raw._id ?? "" };
}

export function parseStationGroupsList(json: unknown): StationGroupsListResponse {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    const list = (obj.data ?? []) as StationGroup[];
    return {
      data:        list.map(normalizeStationGroup),
      total:       typeof obj.total       === "number"  ? obj.total       : list.length,
      page:        typeof obj.page        === "number"  ? obj.page        : 1,
      limit:       typeof obj.limit       === "number"  ? obj.limit       : list.length,
      totalPages:  typeof obj.totalPages  === "number"  ? obj.totalPages  : 1,
      hasNextPage: typeof obj.hasNextPage === "boolean" ? obj.hasNextPage : false,
    };
  }
  const list = Array.isArray(json) ? (json as StationGroup[]).map(normalizeStationGroup) : [];
  return { data: list, total: list.length, page: 1, limit: list.length, totalPages: 1, hasNextPage: false };
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

export async function fetchStationGroups(
  params: StationGroupsQueryParams = {},
): Promise<StationGroup[]> {
  try {
    const { data } = await apiClient.get(buildStationGroupsUrl({ limit: 500, ...params }));
    return parseStationGroupsList(data).data;
  } catch (err) {
    throw toApiError(err, "שגיאה בטעינת קבוצות התחנות");
  }
}

export async function createStationGroup(
  payload: CreateStationGroupPayload,
): Promise<StationGroup> {
  try {
    const { data } = await apiClient.post("/api/v1/station-groups", payload);
    return normalizeStationGroup(data as StationGroup);
  } catch (err) {
    throw toApiError(err, "שגיאה ביצירת קבוצת תחנות");
  }
}

export async function updateStationGroup(
  id: string,
  payload: UpdateStationGroupPayload,
): Promise<StationGroup> {
  try {
    const { data } = await apiClient.patch(`/api/v1/station-groups/${id}`, payload);
    return normalizeStationGroup(data as StationGroup);
  } catch (err) {
    throw toApiError(err, "שגיאה בעדכון קבוצת תחנות");
  }
}

export async function deleteStationGroup(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/v1/station-groups/${id}`);
  } catch (err) {
    throw toApiError(err, "שגיאה במחיקת קבוצת תחנות");
  }
}
