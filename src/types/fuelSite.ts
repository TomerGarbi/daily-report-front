import type { StationFuel } from "./station";

export interface Tank {
  _id?: string;
  id?: string;
  name: string;
  fuelType: StationFuel;
  capacity?: number;
}

export interface FuelSite {
  _id?: string;
  id?: string;
  name: string;
  tag: string;
  fuelTypes: StationFuel[];
  tanks: Tank[];
  createdAt: string;
  updatedAt: string;
}

export interface FuelSitesListResponse {
  data: FuelSite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

// ─── Mutation payloads ──────────────────────────────────────────────────────

export interface TankPayload {
  name: string;
  fuelType: StationFuel;
  capacity?: number;
}

export interface CreateFuelSitePayload {
  name: string;
  tag: string;
  fuelTypes?: StationFuel[];
  tanks?: TankPayload[];
}

export type UpdateFuelSitePayload = Partial<CreateFuelSitePayload>;
