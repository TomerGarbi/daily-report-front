/**
 * Domain types for the station / unit catalog managed in the settings area.
 */

/** Ownership type of the station. */
export type StationType = "iec" | "private";

export const STATION_TYPES: StationType[] = ["iec", "private"];

export const STATION_TYPE_LABELS: Record<StationType, string> = {
  iec:     "חברת חשמל",
  private: "פרטית",
};

/** Primary generation fuel / technology of the station. */
export type StationFuel =
  | "gas"
  | "diesel"
  | "solar"
  | "turbine"
  | "coal"
  | "hydro"
  | "wind"
  | "nuclear"
  | "mazut"
  | "methanol"
  | "other";

export const STATION_FUELS: StationFuel[] = [
  "gas",
  "diesel",
  "solar",
  "turbine",
  "coal",
  "hydro",
  "wind",
  "nuclear",
  "mazut",
  "methanol",
  "other",
];

export const STATION_FUEL_LABELS: Record<StationFuel, string> = {
  gas:      "גז",
  diesel:   "דיזל",
  solar:    "סולרי",
  turbine:  "טורבינה",
  coal:     "פחם",
  hydro:    "הידרו",
  wind:     "רוח",
  nuclear:  "גרעיני",
  mazut:    "מזוט",
  methanol: "מתאנול",
  other:    "אחר",
};

export interface Unit {
  /** Mongo sub-doc id; surfaced through Mongoose's `_id` virtual. */
  _id?: string;
  id?: string;
  tag: string;
  installedCapacity: number;
  mainFuel: string;
  secondaryFuels: string[];
}

export interface Station {
  _id?: string;
  id?: string;
  name: string;
  tag: string;
  type: StationType;
  fuel: StationFuel;
  units: Unit[];
  createdAt: string;
  updatedAt: string;
}

export interface StationsListResponse {
  data: Station[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

// ─── Mutation payloads ──────────────────────────────────────────────────────

export interface UnitPayload {
  tag: string;
  installedCapacity: number;
  mainFuel: string;
  secondaryFuels?: string[];
}

export interface CreateStationPayload {
  name: string;
  tag: string;
  type: StationType;
  fuel: StationFuel;
  units?: UnitPayload[];
}

export interface UpdateStationPayload extends Partial<CreateStationPayload> {}
