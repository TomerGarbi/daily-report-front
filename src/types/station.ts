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

/** One fuel a unit can run on, plus the peak MW it produces on that fuel. */
export interface FuelCapacity {
  type: StationFuel;
  capacity: number;
}

export interface Unit {
  /** Mongo sub-doc id; surfaced through Mongoose's `_id` virtual. */
  _id?: string;
  id?: string;
  /** Human-friendly unit number (unique within the parent station). */
  number: number;
  /** Primary fuel + its peak capacity in MW. */
  mainFuel: FuelCapacity;
  /** Backup fuels the unit can switch to, each with its own peak capacity. */
  secondaryFuels: FuelCapacity[];
}

export interface Station {
  _id?: string;
  id?: string;
  name: string;
  tag: string;
  type: StationType;
  /**
   * Units define the station's capacity and fuels. The station's overall
   * "main fuel" is derived (see `getStationMainFuel`) — not stored.
   */
  units: Unit[];
  createdAt: string;
  updatedAt: string;
}

// ─── Derived helpers ────────────────────────────────────────────────────────

/**
 * Return the station's primary fuel by taking the most common `mainFuel.type`
 * across its units. Ties are resolved by the canonical order in
 * `STATION_FUELS`. Returns `null` for a station with no units.
 */
export function getStationMainFuel(units: Unit[] | undefined): StationFuel | null {
  if (!units || units.length === 0) return null;
  const counts = new Map<StationFuel, number>();
  for (const u of units) {
    const t = u.mainFuel?.type;
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best: StationFuel | null = null;
  let bestCount = 0;
  for (const f of STATION_FUELS) {
    const c = counts.get(f) ?? 0;
    if (c > bestCount) {
      best = f;
      bestCount = c;
    }
  }
  return best;
}

/** Sum of each unit's main-fuel peak capacity across the station, in MW. */
export function getStationTotalCapacity(units: Unit[] | undefined): number {
  if (!units) return 0;
  return units.reduce((sum, u) => sum + (Number(u.mainFuel?.capacity) || 0), 0);
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
  number: number;
  mainFuel: FuelCapacity;
  secondaryFuels?: FuelCapacity[];
}

export interface CreateStationPayload {
  name: string;
  tag: string;
  type: StationType;
  units?: UnitPayload[];
}

export interface UpdateStationPayload extends Partial<CreateStationPayload> {}
