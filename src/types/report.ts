export type ReportStatus = "draft" | "published";

export interface IUserRef {
  username: string;
  userId: string;
}

// ─── Station types ──────────────────────────────────────────────────────────

export type StationStatus = "Active" | "Inactive" | "Maintenance";

export interface StationRow {
  stationNumber: number;
  installedCapacity: number;
  availableCapacity: number;
  peakCapacity: number;
  minReserveCapacity: number;
  secondaryFuelPeakCapacity: number;
  status: StationStatus;
  startTime?: string;
  endTime?: string;
  updatedEndTime?: string;
  notes?: string;

  // ── Optional catalog linkage ───────────────────────────────────────────────
  // When present, this row was created from the station/unit catalog and the
  // capacity / fuel fields below are read-only in the report form (they're
  // edited in /settings/stations instead). Legacy free-text rows simply
  // leave these unset.
  stationId?: string;
  unitId?: string;
  /** Main fuel — default copied from the catalog unit. */
  mainFuel?: string;
  /** Secondary fuels — default copied from the catalog unit. */
  secondaryFuels?: string[];
}

/** Map of station-group name → rows */
export type StationData = Record<string, StationRow[]>;

// ─── Report content ─────────────────────────────────────────────────────────

import type { StationFuel } from "./station";
import { STATION_FUELS } from "./station";

/**
 * Top-level report content.
 *
 * Stations are grouped by ownership type (`private` vs `iec`) and then by
 * primary fuel. Each leaf bucket is a `StationData` map (station-name → rows).
 *
 * This shape replaces the legacy 4-bucket layout
 * (`stationData` / `gasData` / `renewableData` / `electricData`) which was
 * tied to the old `category` enum on stations.
 */
// ─── Forecast section ──────────────────────────────────────────────────────

/** One day's load forecast figures. */
export interface LoadForecastDay {
  /** Forecasted peak load (MW). */
  value: number;
  /** Hour of the peak load (HH:MM, 24h). */
  peakHour: string;
  /** Forecasted load (MW) at the minimal-reserve hour. */
  minReserveValue: number;
  /** Hour of the minimal reserve (HH:MM, 24h). */
  minReserveHour: string;
}

/** One day's weather snapshot. */
export interface WeatherDay {
  temperatureC: number;
  feelsLikeC:   number;
  humidityPct:  number;
}

/** Whether a day's weather values came from the DB or were entered manually. */
export type WeatherSource = "db" | "manual";

/** Full forecast block stored on `report.content.forecast`. */
export interface ForecastBlock {
  load: {
    today:    LoadForecastDay;
    tomorrow: LoadForecastDay;
  };
  weather: {
    region:    string;
    fetchedAt?: string;
    today:     WeatherDay;
    tomorrow:  WeatherDay;
    source: {
      today:    WeatherSource;
      tomorrow: WeatherSource;
    };
  };
}

export interface ReportContent {
  private:   Partial<Record<StationFuel, StationData>>;
  iec:       Partial<Record<StationFuel, StationData>>;
  forecast?: ForecastBlock;
  archive?:  ArchiveBlock;
  /** Optional additional historical days, ordered from most-recent (day before
   *  yesterday) backwards. Same shape as `archive`. */
  archiveExtraDays?: ArchiveBlock[];
  /** Editable same-day-last-year archive block. Prefilled from the
   *  external server but fully overridable by the user. */
  lastYearArchive?: LastYearArchiveBlock;
}

export const emptyReportContent = (): ReportContent => ({
  private: {},
  iec:     {},
});

/**
 * Best-effort migration from older payloads (or partial new-shape ones)
 * to the canonical `ReportContent` structure. Always returns a value
 * with both `private` and `iec` keys present, never throws.
 */
export function normalizeReportContent(raw: unknown): ReportContent {
  const out = emptyReportContent();
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;

  // ── New shape ────────────────────────────────────────────────────────────
  const isFuelMap = (v: unknown): v is Partial<Record<StationFuel, StationData>> =>
    !!v && typeof v === "object";
  if (isFuelMap(obj.private)) Object.assign(out.private, obj.private);
  if (isFuelMap(obj.iec))     Object.assign(out.iec,     obj.iec);
  if (obj.archive)             out.archive = normalizeArchiveBlock(obj.archive);
  if (obj.lastYearArchive)     out.lastYearArchive = normalizeLastYearArchiveBlock(obj.lastYearArchive);
  if (Array.isArray(obj.archiveExtraDays)) {
    out.archiveExtraDays = obj.archiveExtraDays.map(normalizeArchiveBlock);
  }
  if (obj.forecast)            out.forecast = obj.forecast as ForecastBlock;

  // ── Legacy shape ─────────────────────────────────────────────────────────
  // Migrate if any of the old keys are present and the new ones were empty.
  const legacyKeys = ["stationData", "gasData", "renewableData", "electricData"] as const;
  const hasLegacy = legacyKeys.some((k) => obj[k] && typeof obj[k] === "object");
  if (hasLegacy) {
    const placeRows = (
      bucket: "private" | "iec",
      data: unknown,
      fallbackFuel: StationFuel,
    ) => {
      if (!data || typeof data !== "object") return;
      for (const [name, rows] of Object.entries(data as Record<string, StationRow[]>)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;
        // Group rows by their own mainFuel when present, otherwise the fallback.
        const byFuel = new Map<StationFuel, StationRow[]>();
        for (const r of rows) {
          const f = (STATION_FUELS as string[]).includes(r.mainFuel ?? "")
            ? (r.mainFuel as StationFuel)
            : fallbackFuel;
          const arr = byFuel.get(f) ?? [];
          arr.push(r);
          byFuel.set(f, arr);
        }
        for (const [fuel, fuelRows] of byFuel) {
          const fuelBucket = (out[bucket][fuel] ??= {});
          fuelBucket[name] = [...(fuelBucket[name] ?? []), ...fuelRows];
        }
      }
    };
    placeRows("private", obj.stationData,   "other");
    placeRows("private", obj.gasData,       "gas");
    placeRows("private", obj.renewableData, "solar");
    placeRows("iec",     obj.electricData,  "gas");
  }

  return out;
}

// ─── Report ─────────────────────────────────────────────────────────────────

export interface Report {
  _id?: string;
  id: string;
  title: string;
  description: string;
  content?: ReportContent;
  status: ReportStatus;
  version: number;
  createdBy: IUserRef;
  updatedBy: IUserRef;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsResponse {
  data: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

// ─── Archive (yesterday) ────────────────────────────────────────────────────

/**
 * Persisted, editable archive block stored on `report.content.archive`.
 * Prefilled from the server prefill endpoint but fully overridable.
 */
export interface ArchiveBlock {
  /** ISO date of yesterday — informational, not user-editable. */
  date: string;
  /** Hebrew day name — informational. */
  dayName: string;
  peakConsumptionHour: string;
  totalsMwhByFuel: Partial<Record<StationFuel, number>>;
  renewableMwh: number;
  totalIecMwh: number;
  totalPrivateMwh: number;
  weather: {
    temperatureC: number;
    feelsLikeC:   number;
    humidityPct:  number;
  };
}

export function emptyArchiveBlock(): ArchiveBlock {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  return {
    date:                yesterday.toISOString(),
    dayName:             "",
    peakConsumptionHour: "",
    totalsMwhByFuel:     {},
    renewableMwh:        0,
    totalIecMwh:         0,
    totalPrivateMwh:     0,
    weather: { temperatureC: 0, feelsLikeC: 0, humidityPct: 0 },
  };
}

export function normalizeArchiveBlock(raw: unknown): ArchiveBlock {
  const e = emptyArchiveBlock();
  if (!raw || typeof raw !== "object") return e;
  const o = raw as Record<string, unknown>;
  const w = (o.weather && typeof o.weather === "object") ? o.weather as Record<string, unknown> : {};
  return {
    date:                typeof o.date === "string" ? o.date : e.date,
    dayName:             typeof o.dayName === "string" ? o.dayName : e.dayName,
    peakConsumptionHour: typeof o.peakConsumptionHour === "string" ? o.peakConsumptionHour : e.peakConsumptionHour,
    totalsMwhByFuel:     (o.totalsMwhByFuel && typeof o.totalsMwhByFuel === "object") ? o.totalsMwhByFuel as ArchiveBlock["totalsMwhByFuel"] : {},
    renewableMwh:        typeof o.renewableMwh  === "number" ? o.renewableMwh  : 0,
    totalIecMwh:         typeof o.totalIecMwh   === "number" ? o.totalIecMwh   : 0,
    totalPrivateMwh:     typeof o.totalPrivateMwh === "number" ? o.totalPrivateMwh : 0,
    weather: {
      temperatureC: typeof w.temperatureC === "number" ? w.temperatureC : 0,
      feelsLikeC:   typeof w.feelsLikeC   === "number" ? w.feelsLikeC   : 0,
      humidityPct:  typeof w.humidityPct  === "number" ? w.humidityPct  : 0,
    },
  };
}

/** Hourly weather snapshot returned by the archive endpoint. */
export interface ArchiveWeather {
  temperatureC: number;
  feelsLikeC:   number;
  humidityPct:  number;
}

/**
 * Yesterday's archived production + weather data, as returned by
 * `GET /api/v1/reports/archive/yesterday`. Rendered read-only by the
 * report's "archive" stepper section.
 */
export interface ArchiveData {
  /** ISO date string (UTC midnight of yesterday). */
  date: string;
  /** Hebrew day name, e.g. "יום שלישי". */
  dayName: string;
  /** "HH:MM" of yesterday's national peak consumption hour. */
  peakConsumptionHour: string | null;
  /** Per-fuel total energy production (MWh). Missing keys default to 0. */
  totalsMwhByFuel: Partial<Record<StationFuel, number>>;
  /** Sum of solar + hydro + wind, computed server-side. */
  renewableMwh: number;
  /** Total energy production from IEC sources (MWh). */
  totalIecMwh: number | null;
  /** Total energy production from private producers (MWh). */
  totalPrivateMwh: number | null;
  /** Weather at the peak hour. `null` when unavailable. */
  weather: ArchiveWeather | null;
  /** `false` when both upstream integrations failed; UI should render an empty notice. */
  hasData: boolean;
}

/**
 * Same-calendar-day-last-year archive data, returned by
 * `GET /api/v1/reports/archive/last-year`. Always read-only — no
 * persistence on the report.
 */
export interface LastYearArchiveData {
  /** ISO date string (UTC midnight, exactly one year before yesterday). */
  date: string;
  /** Hebrew day name. */
  dayName: string;
  peakConsumptionHour: string | null;
  /** Peak instantaneous consumption (MW) at the peak hour. */
  peakConsumptionMw: number | null;
  totalIecMwh: number | null;
  totalPrivateMwh: number | null;
  /** `iecTotal + privateTotal`, with nulls treated as 0. */
  totalMwh: number;
  weather: ArchiveWeather | null;
  /** Year-to-date energy growth percentage relative to the prior year. */
  ytdEnergyGrowthPct: number | null;
  hasData: boolean;
}

/**
 * Persisted, editable last-year archive block stored on
 * `report.content.lastYearArchive`. Prefilled from the server prefill
 * endpoint but fully overridable.
 */
export interface LastYearArchiveBlock {
  /** ISO date — informational. */
  date: string;
  /** Hebrew day name — informational. */
  dayName: string;
  peakConsumptionHour: string;
  peakConsumptionMw: number;
  totalIecMwh: number;
  totalPrivateMwh: number;
  totalMwh: number;
  weather: {
    temperatureC: number;
    feelsLikeC:   number;
    humidityPct:  number;
  };
  ytdEnergyGrowthPct: number;
}

export function emptyLastYearArchiveBlock(): LastYearArchiveBlock {
  // Same calendar day last year (relative to yesterday).
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return {
    date:                d.toISOString(),
    dayName:             "",
    peakConsumptionHour: "",
    peakConsumptionMw:   0,
    totalIecMwh:         0,
    totalPrivateMwh:     0,
    totalMwh:            0,
    weather: { temperatureC: 0, feelsLikeC: 0, humidityPct: 0 },
    ytdEnergyGrowthPct:  0,
  };
}

export function normalizeLastYearArchiveBlock(raw: unknown): LastYearArchiveBlock {
  const e = emptyLastYearArchiveBlock();
  if (!raw || typeof raw !== "object") return e;
  const o = raw as Record<string, unknown>;
  const w = (o.weather && typeof o.weather === "object") ? o.weather as Record<string, unknown> : {};
  return {
    date:                typeof o.date === "string" ? o.date : e.date,
    dayName:             typeof o.dayName === "string" ? o.dayName : e.dayName,
    peakConsumptionHour: typeof o.peakConsumptionHour === "string" ? o.peakConsumptionHour : e.peakConsumptionHour,
    peakConsumptionMw:   typeof o.peakConsumptionMw === "number" ? o.peakConsumptionMw : 0,
    totalIecMwh:         typeof o.totalIecMwh === "number" ? o.totalIecMwh : 0,
    totalPrivateMwh:     typeof o.totalPrivateMwh === "number" ? o.totalPrivateMwh : 0,
    totalMwh:            typeof o.totalMwh === "number" ? o.totalMwh : 0,
    weather: {
      temperatureC: typeof w.temperatureC === "number" ? w.temperatureC : 0,
      feelsLikeC:   typeof w.feelsLikeC   === "number" ? w.feelsLikeC   : 0,
      humidityPct:  typeof w.humidityPct  === "number" ? w.humidityPct  : 0,
    },
    ytdEnergyGrowthPct:  typeof o.ytdEnergyGrowthPct === "number" ? o.ytdEnergyGrowthPct : 0,
  };
}
