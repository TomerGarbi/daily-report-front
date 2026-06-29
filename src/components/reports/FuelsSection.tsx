"use client";

import { useCallback, useMemo } from "react";
import { Fuel, Droplet } from "lucide-react";
import { FieldText } from "@/components/inputs/FieldText";
import type { FuelSite } from "@/types/fuelSite";
import { type StationFuel } from "@/types/station";
import {
  type FuelsBlock,
  type FuelRow,
} from "@/types/report";

// ─── Labels ─────────────────────────────────────────────────────────────────

const FUEL_LABELS_HE: Record<StationFuel, string> = {
  gas:      "גז טבעי",
  diesel:   "סולר",
  solar:    "סולארי",
  turbine:  "טורבינה",
  coal:     "פחם",
  hydro:    "הידרו",
  wind:     "רוח",
  nuclear:  "גרעיני",
  mazut:    "מזוט",
  methanol: "מתנול",
  other:    "אחר",
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface FuelsSectionProps {
  value: FuelsBlock;
  onChange?: (next: FuelsBlock) => void;
  readOnly?: boolean;
  /** Fuel-site catalog used to populate the site dropdown. Order is preserved. */
  sites: FuelSite[];
  title?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("he-IL");

function rowTotal(row: FuelRow): number {
  return (Number(row.available) || 0) + (Number(row.bottom) || 0);
}

// ─── Grouping ───────────────────────────────────────────────────────────────

type FuelGroup = {
  fuelType: StationFuel | "";
  rows: { row: FuelRow; index: number }[];
};
type SiteGroup = {
  stationTag: string;
  stationName: string;
  totalTanks: number;
  fuels: FuelGroup[];
};

function buildGroups(value: FuelsBlock): SiteGroup[] {
  const siteOrder: string[] = [];
  const siteMap = new Map<string, SiteGroup>();

  value.forEach((row, index) => {
    let site = siteMap.get(row.stationTag);
    if (!site) {
      site = {
        stationTag: row.stationTag,
        stationName: row.stationName,
        totalTanks: 0,
        fuels: [],
      };
      siteMap.set(row.stationTag, site);
      siteOrder.push(row.stationTag);
    }
    const fuelKey = row.fuelType || "";
    let fuel = site.fuels.find((f) => f.fuelType === fuelKey);
    if (!fuel) {
      fuel = { fuelType: row.fuelType, rows: [] };
      site.fuels.push(fuel);
    }
    fuel.rows.push({ row, index });
    site.totalTanks += 1;
  });

  return siteOrder.map((tag) => siteMap.get(tag)!);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FuelsSection({
  value,
  onChange,
  readOnly = false,
  sites,
  title = "דלקים",
}: FuelsSectionProps) {
  const editable = !readOnly && !!onChange;

  const groups = useMemo(() => buildGroups(value), [value]);

  const update = useCallback(
    (idx: number, patch: Partial<FuelRow>) => {
      if (!onChange) return;
      onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    },
    [value, onChange],
  );

  // ── Totals & validation ──────────────────────────────────────────────────
  const grandTotals = useMemo(() => {
    let available = 0;
    let bottom = 0;
    for (const row of value) {
      available += Number(row.available) || 0;
      bottom    += Number(row.bottom)    || 0;
    }
    return { available, bottom, total: available + bottom, rowCount: value.length };
  }, [value]);

  const colCount = 6;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-50 via-orange-50 to-amber-50 ring-1 ring-amber-200 shadow-sm p-6">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-amber-400 via-orange-400 to-amber-400" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-500 text-white shadow-sm">
            <Fuel className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              מלאי דלק לפי אתר, סוג דלק ומיכל — {groups.length} אתרים, {grandTotals.rowCount} מיכלים
            </p>
          </div>
        </div>
      </div>



      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-right font-semibold min-w-[180px]">אתר</th>
                <th className="px-4 py-3 text-right font-semibold min-w-[140px]">סוג דלק</th>
                <th className="px-4 py-3 text-right font-semibold min-w-[160px]">סוג מיכל</th>
                <th className="px-4 py-3 text-right font-semibold min-w-[140px]">זמין</th>
                <th className="px-4 py-3 text-right font-semibold min-w-[140px]">קרקעית</th>
                <th className="px-4 py-3 text-right font-semibold min-w-[140px] bg-orange-50 text-orange-800">
                  סה״כ
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    <Droplet className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                    {editable ? "אין אתרים עדיין — הוסף אתר כדי להתחיל" : "אין נתוני דלקים"}
                  </td>
                </tr>
              ) : (
                groups.map((site) => (
                  <SiteRows
                    key={site.stationTag || "_unknown"}
                    site={site}
                    editable={editable}
                    onUpdate={update}
                  />
                ))
              )}
            </tbody>

            {value.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 text-slate-700 font-semibold">
                  <td className="px-4 py-3" colSpan={3}>
                    סה״כ
                  </td>
                  <td className="px-4 py-3">{fmt(grandTotals.available)}</td>
                  <td className="px-4 py-3">{fmt(grandTotals.bottom)}</td>
                  <td className="px-4 py-3 bg-orange-50 text-orange-900 font-bold text-base">
                    {fmt(grandTotals.total)}
                  </td>
                  {editable && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Site rows sub-component ────────────────────────────────────────────────

function SiteRows({
  site,
  editable,
  onUpdate,
}: {
  site: SiteGroup;
  editable: boolean;
  onUpdate: (idx: number, patch: Partial<FuelRow>) => void;
}) {
  const rowsJsx: React.ReactNode[] = [];
  let isFirstSiteRow = true;

  for (const fuel of site.fuels) {
    let isFirstFuelRow = true;
    for (const { row, index } of fuel.rows) {
      const total = rowTotal(row);
      const incomplete = !row.stationTag || !row.fuelType || !row.tankType;

      rowsJsx.push(
        <tr
          key={row.id}
          className={`${
            isFirstSiteRow
              ? "border-t-2 border-slate-400"
              : "border-t border-slate-100"
          } ${incomplete ? "bg-amber-50/30" : "hover:bg-slate-50/60"}`}
        >
          {/* Site cell (only on first row of the site) */}
          {isFirstSiteRow && (
            <td
              rowSpan={site.totalTanks}
              className="px-4 py-2 align-top border-l border-slate-300 bg-slate-50/40"
            >
              <div className="font-semibold text-slate-800">
                {site.stationName || site.stationTag || "—"}
              </div>
            </td>
          )}

          {/* Fuel cell (only on first row of the fuel group) */}
          {isFirstFuelRow && (
            <td
              rowSpan={fuel.rows.length}
              className="px-4 py-2 align-top border-l border-slate-200"
            >
              <span className="text-slate-800 font-medium">
                {fuel.fuelType ? FUEL_LABELS_HE[fuel.fuelType] : "—"}
              </span>
            </td>
          )}

          {/* Tank type */}
          <td className="px-4 py-2">
            {editable ? (
              <FieldText
                value={row.tankType}
                onChange={(e) => onUpdate(index, { tankType: e.target.value })}
                placeholder="שם מיכל…"
              />
            ) : (
              <span className="text-slate-800">{row.tankType || "—"}</span>
            )}
          </td>

          {/* Available */}
          <td className="px-4 py-2">
            {editable ? (
              <FieldText
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={row.available}
                onChange={(e) =>
                  onUpdate(index, { available: Number(e.target.value) || 0 })
                }
              />
            ) : (
              <span className="text-slate-800 font-medium">{fmt(row.available)}</span>
            )}
          </td>

          {/* Bottom */}
          <td className="px-4 py-2">
            {editable ? (
              <FieldText
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={row.bottom}
                onChange={(e) =>
                  onUpdate(index, { bottom: Number(e.target.value) || 0 })
                }
              />
            ) : (
              <span className="text-slate-800 font-medium">{fmt(row.bottom)}</span>
            )}
          </td>

          {/* Total */}
          <td className="px-4 py-2 bg-orange-50/40">
            <span className="text-orange-900 font-bold text-base">{fmt(total)}</span>
          </td>


        </tr>,
      );

      isFirstSiteRow = false;
      isFirstFuelRow = false;
    }
  }

  return <>{rowsJsx}</>;
}
