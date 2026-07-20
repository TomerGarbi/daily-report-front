"use client";

/**
 * Shared report-content rendering helpers.
 *
 * `GroupedStationTables` renders one `StationTable` per {@link StationGroup}
 * inside a single ownership-type bucket (`private` or `iec`). Used by both
 * the new-report and edit-report flows so the layout stays consistent.
 *
 * `seedTypeFromCatalog` builds a group-bucket map from the station catalog
 * for a given ownership type, with default capacities and `Active` status.
 *
 * The legacy names `FuelGroupedTables` / `FuelBuckets` are re-exported as
 * aliases so callers that still refer to them continue to work.
 */

import { useMemo } from "react";
import { StationTable } from "@/components/StationTable/StationTable";
import type { StationData, GroupBuckets } from "@/types/report";
import type { Station, StationType } from "@/types/station";
import type { StationGroup } from "@/types/stationGroup";

// ─── Types ──────────────────────────────────────────────────────────────────

/** @deprecated Renamed to `GroupBuckets`. Kept as an alias for older imports. */
export type FuelBuckets = GroupBuckets;

// ─── seedTypeFromCatalog ────────────────────────────────────────────────────

/**
 * Build the initial `GroupBuckets` for one ownership type from the station
 * catalog. Stations lacking a `groupId` land in a synthetic `"__ungrouped"`
 * bucket so they remain visible until the admin assigns them to a group.
 */
export function seedTypeFromCatalog(
  stations: Station[],
  type: StationType,
  groups: StationGroup[] = [],
): GroupBuckets {
  const groupById = new Map<string, StationGroup>();
  for (const g of groups) {
    const id = g.id ?? g._id;
    if (id) groupById.set(id, g);
  }

  const out: GroupBuckets = {};
  for (const s of stations) {
    if (s.type !== type) continue;
    if (!s.units || s.units.length === 0) continue;

    const group = s.groupId ? groupById.get(s.groupId) : undefined;
    const groupTag = group?.tag ?? "__ungrouped";
    const bucket = (out[groupTag] ??= {});
    bucket[s.tag] = s.units.map((u, idx) => ({
      stationNumber:             u.number || idx + 1,
      installedCapacity:         u.mainFuel?.capacity ?? 0,
      availableCapacity:         0,
      peakCapacity:              0,
      minReserveCapacity:        0,
      secondaryFuelPeakCapacity: 0,
      status:                    "Active",
      stationId:      s.id ?? s._id,
      unitId:         u.id ?? u._id,
      stationName:    s.name,
      groupTag,
      mainFuel:       u.mainFuel?.type,
      secondaryFuels: (u.secondaryFuels ?? []).map((f) => f.type),
    }));
  }
  return out;
}

// ─── GroupedStationTables ───────────────────────────────────────────────────

export function GroupedStationTables({
  buckets,
  groups,
  type,
  onChange,
  titlePrefix,
  readOnly,
}: {
  buckets: GroupBuckets;
  /** All available groups for this ownership type; used for labels + order. */
  groups: StationGroup[];
  /** Ownership type this section renders. */
  type: StationType;
  onChange?: (next: GroupBuckets) => void;
  titlePrefix: string;
  readOnly?: boolean;
}) {
  // Compute the ordered list of group tags to render:
  //   1. Groups belonging to this `type`, in `order` then name (from catalog).
  //   2. Any bucket keys not represented in the catalog (e.g. stale tags on
  //      an old report) appended at the end so their data is not lost.
  // Groups whose bucket is empty are filtered out at render time.
  const { orderedTags, tagLabels } = useMemo(() => {
    const catalog = groups
      .filter((g) => g.type === type)
      .slice()
      .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name, "he"));

    const seen = new Set<string>();
    const tags: string[] = [];
    const labels = new Map<string, string>();
    for (const g of catalog) {
      tags.push(g.tag);
      labels.set(g.tag, g.name);
      seen.add(g.tag);
    }
    for (const key of Object.keys(buckets)) {
      if (seen.has(key)) continue;
      tags.push(key);
      // Fallback label: friendly stand-in for the ungrouped sentinel, else
      // the raw tag (e.g. an old fuel key on a not-yet-migrated report).
      labels.set(key, key === "__ungrouped" ? "ללא קבוצה" : key);
    }
    return { orderedTags: tags, tagLabels: labels };
  }, [buckets, groups, type]);

  // Empty state — no catalog groups, no data → single blank table so the
  // user can still type free-text rows.
  if (orderedTags.length === 0) {
    return (
      <StationTable
        title={titlePrefix}
        data={{}}
        readOnly={readOnly}
        onChange={
          onChange
            ? (next) => onChange({ ...buckets, __ungrouped: next })
            : undefined
        }
      />
    );
  }

  return (
    <>
      {orderedTags.map((tag) => {
        const data: StationData = buckets[tag] ?? {};
        // Skip groups that have no stations at all.
        if (Object.keys(data).length === 0) return null;
        const label = tagLabels.get(tag) ?? tag;
        return (
          <StationTable
            key={tag}
            title={`${titlePrefix} — ${label}`}
            data={data}
            readOnly={readOnly}
            onChange={
              onChange
                ? (next) => {
                    const merged: GroupBuckets = { ...buckets };
                    if (Object.keys(next).length === 0) {
                      delete merged[tag];
                    } else {
                      merged[tag] = next;
                    }
                    onChange(merged);
                  }
                : undefined
            }
          />
        );
      })}
    </>
  );
}

/**
 * @deprecated Renamed to `GroupedStationTables`. Kept as a compatibility
 * alias for existing imports.
 */
export const FuelGroupedTables = GroupedStationTables;
