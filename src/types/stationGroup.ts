/**
 * Domain types for the station-group catalog managed in the settings area.
 * A `StationGroup` decides how report tables are laid out — each station
 * in the catalog belongs to exactly one group of the matching ownership
 * type, and report content is keyed by `group.tag` (stable string).
 */

import type { StationType } from "@/types/station";

export interface StationGroup {
  _id?: string;
  id?: string;
  /** Human-readable display name (unique per type). */
  name: string;
  /** Short, URL-safe identifier — used as the key on report content. */
  tag: string;
  /** Ownership type the group belongs to. */
  type: StationType;
  /** Sort order within the group's type (lower renders first). */
  order: number;
  /** Optional free-text description shown in the settings UI. */
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StationGroupsListResponse {
  data: StationGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

// ─── Mutation payloads ──────────────────────────────────────────────────────

export interface CreateStationGroupPayload {
  name: string;
  tag: string;
  type: StationType;
  order?: number;
  description?: string;
}

export interface UpdateStationGroupPayload extends Partial<CreateStationGroupPayload> {}
