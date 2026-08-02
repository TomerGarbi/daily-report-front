/**
 * db-section-api.ts
 *
 * Typed helpers for the `GET /api/v1/reports/db-section` endpoint.
 * Each function fetches one section's data from the SQL database via the
 * API and returns it ready to be applied directly to the corresponding
 * slice of `ReportContent`.
 *
 * The backend stubs (`fetchPrivateSectionFromDb`, etc. in
 * `services/dbReportService.ts`) are where the actual SQL queries must be
 * implemented. These frontend functions just call the API and normalize the
 * responses into the canonical frontend types.
 */

import { apiClient, toApiError } from "@/lib/apiClient";
import {
  normalizeReportContent,
  type GroupBuckets,
  type ForecastBlock,
  type ArchiveBlock,
  type LastYearArchiveBlock,
  type FuelsBlock,
} from "@/types/report";

// ─── Section name type ────────────────────────────────────────────────────────

export type DbSectionName = "private" | "iec" | "forecast" | "archive" | "fuels";

// ─── Per-section response types ───────────────────────────────────────────────

/** Response shape for the `private` and `iec` sections. */
export type DbStationSectionResponse = GroupBuckets;

/** Response shape for the `forecast` section. */
export type DbForecastSectionResponse = ForecastBlock;

/** Response shape for the `archive` section. */
export interface DbArchiveSectionResponse {
  archive: ArchiveBlock;
  lastYearArchive?: LastYearArchiveBlock;
}

/** Response shape for the `fuels` section. */
export type DbFuelsSectionResponse = FuelsBlock;

// ─── Generic fetch ────────────────────────────────────────────────────────────

/**
 * Low-level fetch — returns raw JSON from the API for the given section.
 * Prefer the typed helpers below for type-safe usage.
 */
async function fetchDbSection(
  section: DbSectionName,
  date?: string,
): Promise<unknown> {
  const params: Record<string, string> = { section };
  if (date) params.date = date;
  try {
    const { data } = await apiClient.get("/api/v1/reports/db-section", { params });
    return data;
  } catch (err) {
    throw toApiError(err, `שגיאה בטעינת נתוני "${section}" ממסד הנתונים`);
  }
}

// ─── Typed section helpers ────────────────────────────────────────────────────

/**
 * Fetch the **private** station/unit data from the SQL DB for the given date.
 *
 * The backend returns fuel-keyed bucket data which is automatically remapped
 * to the group-keyed format (`GroupBuckets`) via `normalizeReportContent`.
 *
 * @param date  ISO "YYYY-MM-DD". Defaults to today when omitted.
 */
export async function fetchPrivateSectionFromDb(
  date?: string,
): Promise<DbStationSectionResponse> {
  const raw = await fetchDbSection("private", date);
  // Wrap in a partial content object and normalize to get group-keyed buckets.
  const normalized = normalizeReportContent({ private: raw });
  return normalized.private;
}

/**
 * Fetch the **IEC** station/unit data from the SQL DB for the given date.
 *
 * @param date  ISO "YYYY-MM-DD". Defaults to today when omitted.
 */
export async function fetchIecSectionFromDb(
  date?: string,
): Promise<DbStationSectionResponse> {
  const raw = await fetchDbSection("iec", date);
  const normalized = normalizeReportContent({ iec: raw });
  return normalized.iec;
}

/**
 * Fetch the **forecast** (load + weather) data from the SQL DB.
 *
 * @param date  ISO "YYYY-MM-DD". Defaults to today when omitted.
 */
export async function fetchForecastSectionFromDb(
  date?: string,
): Promise<DbForecastSectionResponse> {
  const raw = await fetchDbSection("forecast", date);
  // normalizeReportContent handles forecast normalization.
  const normalized = normalizeReportContent({ forecast: raw });
  if (!normalized.forecast) {
    throw new Error("Invalid forecast data received from database");
  }
  return normalized.forecast;
}

/**
 * Fetch the **archive** (yesterday's energy totals + weather) data from the
 * SQL DB, including the optional same-day last-year comparison block.
 *
 * @param date  ISO "YYYY-MM-DD". Defaults to today when omitted.
 */
export async function fetchArchiveSectionFromDb(
  date?: string,
): Promise<DbArchiveSectionResponse> {
  const raw = await fetchDbSection("archive", date) as {
    archive: unknown;
    lastYearArchive?: unknown;
  };
  const normalized = normalizeReportContent({
    archive:        raw.archive,
    lastYearArchive: raw.lastYearArchive,
  });
  if (!normalized.archive) {
    throw new Error("Invalid archive data received from database");
  }
  return {
    archive:        normalized.archive,
    lastYearArchive: normalized.lastYearArchive,
  };
}

/**
 * Fetch the **fuels** (per-tank inventory) data from the SQL DB.
 *
 * @param date  ISO "YYYY-MM-DD". Defaults to today when omitted.
 */
export async function fetchFuelsSectionFromDb(
  date?: string,
): Promise<DbFuelsSectionResponse> {
  const raw = await fetchDbSection("fuels", date) as unknown[];
  const normalized = normalizeReportContent({ fuels: raw });
  return normalized.fuels ?? [];
}
