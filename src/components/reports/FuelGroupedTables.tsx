"use client";

/**
 * Shared report-content rendering helpers.
 *
 * `FuelGroupedTables` renders one `StationTable` per fuel inside a single
 * ownership-type bucket (`private` or `iec`). Used by both the new-report
 * and edit-report flows so the layout stays consistent.
 *
 * `seedTypeFromCatalog` builds a fuel-bucket map from the station catalog
 * for a given ownership type, with default capacities and `Active` status.
 */

import { useMemo } from "react";
import { StationTable } from "@/components/StationTable/StationTable";
import type { StationData } from "@/types/report";
import {
  STATION_FUELS,
  STATION_FUEL_LABELS,
  getStationMainFuel,
  type Station,
  type StationFuel,
  type StationType,
} from "@/types/station";

export type FuelBuckets = Partial<Record<StationFuel, StationData>>;

export function seedTypeFromCatalog(
  stations: Station[],
  type: StationType,
): FuelBuckets {
  const out: FuelBuckets = {};
  for (const s of stations) {
    if (s.type !== type) continue;
    if (!s.units || s.units.length === 0) continue;
    const fuel = getStationMainFuel(s.units);
    if (!fuel) continue;
    const bucket = (out[fuel] ??= {});
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
      mainFuel:       u.mainFuel?.type,
      secondaryFuels: (u.secondaryFuels ?? []).map((f) => f.type),
    }));
  }
  return out;
}

export function FuelGroupedTables({
  buckets,
  onChange,
  titlePrefix,
  readOnly,
}: {
  buckets: FuelBuckets;
  onChange?: (next: FuelBuckets) => void;
  titlePrefix: string;
  readOnly?: boolean;
}) {
  const orderedFuels = useMemo<StationFuel[]>(() => {
    const present = new Set<StationFuel>();
    for (const k of Object.keys(buckets) as StationFuel[]) {
      const v = buckets[k];
      if (v && Object.keys(v).length > 0) present.add(k);
    }
    return STATION_FUELS.filter((f) => present.has(f));
  }, [buckets]);

  if (orderedFuels.length === 0) {
    return (
      <StationTable
        title={titlePrefix}
        data={{}}
        readOnly={readOnly}
        onChange={
          onChange
            ? (next) => onChange({ ...buckets, other: next })
            : undefined
        }
      />
    );
  }

  return (
    <>
      {orderedFuels.map((fuel) => {
        const data = buckets[fuel] ?? {};
        const fuelLabel = STATION_FUEL_LABELS[fuel] ?? fuel;
        return (
          <StationTable
            key={fuel}
            title={`${titlePrefix} — ${fuelLabel}`}
            data={data}
            readOnly={readOnly}
            onChange={
              onChange
                ? (next) => {
                    const merged: FuelBuckets = { ...buckets };
                    if (Object.keys(next).length === 0) {
                      delete merged[fuel];
                    } else {
                      merged[fuel] = next;
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
