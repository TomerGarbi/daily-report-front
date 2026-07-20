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
  // When present, this row was created from the station/unit catalog and
  // the capacity / fuel fields below are read-only in the report form
  // (they're edited in /settings/stations instead). Legacy free-text rows
  // simply leave these unset.
  //
  // IMPORTANT — snapshot semantics:
  //   `stationName`, `mainFuel`, `secondaryFuels` and `installedCapacity`
  //   are FROZEN COPIES taken at row-creation time. They are NOT live
  //   references to the catalog. Once the row is saved, later catalog
  //   edits (rename, fuel change, capacity update, unit deletion, etc.)
  //   have no effect on this report. This is intentional: historical
  //   reports must remain reproducible even if the catalog changes or
  //   the source station/unit is deleted.
  //   `stationId` / `unitId` are kept purely for traceability — they may
  //   dangle if the catalog entry is later removed.
  stationId?: string;
  unitId?: string;
  /** Snapshot of the station's display name at row-creation time. */
  stationName?: string;
  /** Snapshot of the unit's primary fuel at row-creation time. */
  mainFuel?: string;
  /** Snapshot of the unit's backup fuels at row-creation time. */
  secondaryFuels?: string[];
  /**
   * Snapshot of the station's `StationGroup.tag` at row-creation time.
   * Used purely as a stable label if the outer bucket key ever gets out
   * of sync with reality; the authoritative grouping is still the outer
   * `GroupBuckets` key.
   */
  groupTag?: string;
}

/**
 * Inner bucket keyed by station display name → rows. Nested inside a
 * {@link GroupBuckets} entry to give report tables a two-level layout
 * (group → station → rows).
 */
export type StationData = Record<string, StationRow[]>;

// ─── Report content ─────────────────────────────────────────────────────────

import type { StationFuel } from "./station";
import { STATION_FUELS } from "./station";

/**
 * Top-level report content.
 *
 * Stations are grouped by ownership type (`private` vs `iec`) and then
 * further by {@link StationGroup} — the outer bucket keys are `group.tag`
 * strings. Each leaf bucket is a `StationData` map (station-name → rows).
 *
 * This shape replaces the previous fuel-based layout
 * (`Partial<Record<StationFuel, StationData>>`) which was migrated by
 * `scripts/migrateStationsToGroups.ts`. Legacy reports whose keys still
 * match `StationFuel` values are re-mapped on the fly by
 * `normalizeReportContent` using the default `<type>-<fuel>` tags.
 */
/** Bucket keyed by `StationGroup.tag`. */
export type GroupBuckets = Record<string, StationData>;

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
  description:  string;
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
  private:   GroupBuckets;
  iec:       GroupBuckets;
  forecast?: ForecastBlock;
  archive?:  ArchiveBlock;
  /** Optional additional historical days, ordered from most-recent (day before
   *  yesterday) backwards. Same shape as `archive`. */
  archiveExtraDays?: ArchiveBlock[];
  /** Editable same-day-last-year archive block. Prefilled from the
   *  external server but fully overridable by the user. */
  lastYearArchive?: LastYearArchiveBlock;
  /** Per-tank fuel inventory rows (site, fuel type, tank type, available, bottom). */
  fuels?: FuelsBlock;
}

export const emptyReportContent = (): ReportContent => ({
  private: {},
  iec:     {},
});

/**
 * Best-effort migration from older payloads (or partial new-shape ones)
 * to the canonical `ReportContent` structure. Always returns a value
 * with both `private` and `iec` keys present, never throws.
 *
 * Legacy fuel-keyed buckets (`private.gas`, `private.solar`, …) are
 * transparently re-mapped to the default `<type>-<fuel>` group tags
 * emitted by `scripts/migrateStationsToGroups.ts` so old reports keep
 * rendering under the new group-based UI even before the DB migration
 * runs.
 */
export function normalizeReportContent(raw: unknown): ReportContent {
  const out = emptyReportContent();
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;

  // ── New / group-keyed shape (or legacy fuel-keyed, remapped inline) ──────
  const remapBucket = (
    type: "private" | "iec",
    src: unknown,
  ): GroupBuckets => {
    const result: GroupBuckets = {};
    if (!src || typeof src !== "object") return result;
    for (const [key, data] of Object.entries(src as Record<string, unknown>)) {
      if (!data || typeof data !== "object") continue;
      // If the key is a legacy fuel name, remap it to the default group
      // tag so the row lands under the migrated bucket.
      const groupTag = (STATION_FUELS as string[]).includes(key)
        ? `${type}-${key}`
        : key;
      const bucket = (result[groupTag] ??= {});
      for (const [stationName, rows] of Object.entries(data as Record<string, unknown>)) {
        if (!Array.isArray(rows)) continue;
        bucket[stationName] = [
          ...(bucket[stationName] ?? []),
          ...rows.map((r): StationRow => ({
            ...(r as StationRow),
            groupTag: (r as StationRow).groupTag ?? groupTag,
          })),
        ];
      }
    }
    return result;
  };

  Object.assign(out.private, remapBucket("private", obj.private));
  Object.assign(out.iec,     remapBucket("iec",     obj.iec));

  if (obj.archive)             out.archive = normalizeArchiveBlock(obj.archive);
  if (obj.lastYearArchive)     out.lastYearArchive = normalizeLastYearArchiveBlock(obj.lastYearArchive);
  if (Array.isArray(obj.archiveExtraDays)) {
    out.archiveExtraDays = obj.archiveExtraDays.map(normalizeArchiveBlock);
  }
  if (obj.forecast)            out.forecast = normalizeForecastBlock(obj.forecast);
  if (Array.isArray(obj.fuels)) {
    out.fuels = obj.fuels.map(normalizeFuelRow);
  }

  // ── Very-legacy 4-bucket shape (pre-fuel-buckets) ────────────────────────
  const legacyKeys = ["stationData", "gasData", "renewableData", "electricData"] as const;
  const hasLegacy = legacyKeys.some((k) => obj[k] && typeof obj[k] === "object");
  if (hasLegacy) {
    const placeRows = (
      type: "private" | "iec",
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
          const groupTag = `${type}-${fuel}`;
          const groupBucket = (out[type][groupTag] ??= {});
          groupBucket[name] = [
            ...(groupBucket[name] ?? []),
            ...fuelRows.map((r) => ({ ...r, groupTag: r.groupTag ?? groupTag })),
          ];
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

function normalizeWeatherDay(raw: unknown): WeatherDay {
  const obj = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    temperatureC: typeof obj.temperatureC === "number" ? obj.temperatureC : 0,
    feelsLikeC:   typeof obj.feelsLikeC   === "number" ? obj.feelsLikeC   : 0,
    humidityPct:  typeof obj.humidityPct  === "number" ? obj.humidityPct  : 0,
    description:  typeof obj.description  === "string" ? obj.description  : "",
  };
}

function normalizeLoadForecastDay(raw: unknown): LoadForecastDay {
  const obj = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    value:           typeof obj.value           === "number" ? obj.value           : 0,
    peakHour:        typeof obj.peakHour        === "string" ? obj.peakHour        : "",
    minReserveValue: typeof obj.minReserveValue === "number" ? obj.minReserveValue : 0,
    minReserveHour:  typeof obj.minReserveHour  === "string" ? obj.minReserveHour  : "",
  };
}

function normalizeForecastBlock(raw: unknown): ForecastBlock {
  const obj = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const load = obj.load && typeof obj.load === "object" ? obj.load as Record<string, unknown> : {};
  const weather = obj.weather && typeof obj.weather === "object" ? obj.weather as Record<string, unknown> : {};
  const source = weather.source && typeof weather.source === "object" ? weather.source as Record<string, unknown> : {};
  const sourceToday = source.today === "db" || source.today === "manual" ? source.today : "manual";
  const sourceTomorrow = source.tomorrow === "db" || source.tomorrow === "manual" ? source.tomorrow : "manual";

  return {
    load: {
      today:    normalizeLoadForecastDay(load.today),
      tomorrow: normalizeLoadForecastDay(load.tomorrow),
    },
    weather: {
      region:    typeof weather.region === "string" && weather.region.trim() ? weather.region : "gush-dan",
      fetchedAt: typeof weather.fetchedAt === "string" ? weather.fetchedAt : undefined,
      today:     normalizeWeatherDay(weather.today),
      tomorrow:  normalizeWeatherDay(weather.tomorrow),
      source: {
        today:    sourceToday,
        tomorrow: sourceTomorrow,
      },
    },
  };
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

// ─── Fuels (per-tank inventory) ─────────────────────────────────────────────

export interface FuelRow {
  /** Stable client-side id; not persisted as a constraint, just for React keys. */
  id: string;
  /** Fuel-site catalog tag (stable). Empty string when not yet picked. */
  stationTag: string;
  /** Display name, denormalized from the catalog at row-creation time. */
  stationName: string;
  /** Defaults to the picked tank's fuel type. */
  fuelType: StationFuel | "";
  /** Free-text tank label (typically copied from the FuelSite tank name). */
  tankType: string;
  /** Available amount in the tank (excluding the un-pumpable bottom reserve). */
  available: number;
  /** "Bottom" / dead-stock reserve that cannot be pumped out. */
  bottom: number;
}

export type FuelsBlock = FuelRow[];

export function emptyFuelRow(): FuelRow {
  return {
    id:          (typeof crypto !== "undefined" && crypto.randomUUID)
                   ? crypto.randomUUID()
                   : `fuel-${Math.random().toString(36).slice(2, 10)}`,
    stationTag:  "",
    stationName: "",
    fuelType:    "",
    tankType:    "",
    available:   0,
    bottom:      0,
  };
}

export function normalizeFuelRow(raw: unknown): FuelRow {
  const e = emptyFuelRow();
  if (!raw || typeof raw !== "object") return e;
  const o = raw as Record<string, unknown>;
  const isFuel = (v: unknown): v is StationFuel =>
    typeof v === "string" && (STATION_FUELS as string[]).includes(v);
  return {
    id:          typeof o.id === "string" && o.id ? o.id : e.id,
    stationTag:  typeof o.stationTag === "string" ? o.stationTag : "",
    stationName: typeof o.stationName === "string" ? o.stationName : "",
    fuelType:    isFuel(o.fuelType) ? o.fuelType : "",
    tankType:    typeof o.tankType === "string" ? o.tankType : "",
    available:   typeof o.available === "number" && Number.isFinite(o.available) ? o.available : 0,
    bottom:      typeof o.bottom    === "number" && Number.isFinite(o.bottom)    ? o.bottom    : 0,
  };
}
