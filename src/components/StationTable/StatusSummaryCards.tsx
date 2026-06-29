"use client";

import type { ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StatusTotals {
  count: number;
  installed: number;
  available: number;
  peak: number;
  minReserve: number;
  secondaryFuel: number;
}

export interface SummaryTotals {
  installed: number;
  available: number;
  peak: number;
  minReserve: number;
  secondaryFuel: number;
  degradation: number;
  byStatus: Record<string, StatusTotals>;
}

interface Metric {
  label: string;
  value: (s: StatusTotals) => number;
}

interface StatusSummaryCardsProps {
  totals: SummaryTotals;
  /** Order in which per-status cards are rendered. */
  statusOrder: readonly string[];
  /** Translate a status key into its display label. */
  labelFor: (status: string) => string;
  /** Tailwind classes for the per-status pill (border + bg + text). */
  colorFor: (status: string) => string;
  /** Tailwind text-color class for the metric values inside a status card. */
  valueColorFor: (status: string) => string;
  /** Tailwind border-color class for the status card outline. */
  borderColorFor: (status: string) => string;
  /** Section heading (defaults to Hebrew "פירוט לפי סטטוס"). */
  heading?: string;
  /** Label for the totals card (defaults to Hebrew "סה״כ"). */
  totalLabel?: string;
  /** Suffix appended to the unit count, e.g. "יחידות". */
  unitSuffix?: string;
  /** Optional extra content rendered to the right of the cards. */
  trailing?: ReactNode;
}

const EMPTY: StatusTotals = {
  count: 0,
  installed: 0,
  available: 0,
  peak: 0,
  minReserve: 0,
  secondaryFuel: 0,
};

const METRICS: Metric[] = [
  { label: "מותקנת",     value: (s) => s.installed },
  { label: "זמינה",       value: (s) => s.available },
  { label: "מינ׳ רזרבה",  value: (s) => s.minReserve },
  { label: "התדרדרות",    value: (s) => s.installed - s.available },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function StatusSummaryCards({
  totals,
  statusOrder,
  labelFor,
  colorFor,
  valueColorFor,
  borderColorFor,
  heading = "פירוט לפי סטטוס",
  totalLabel = "סה״כ",
  unitSuffix = "יחידות",
  trailing,
}: StatusSummaryCardsProps) {
  const totalCount = Object.values(totals.byStatus).reduce(
    (n, s) => n + s.count,
    0,
  );

  const totalCard: StatusTotals = {
    count: totalCount,
    installed: totals.installed,
    available: totals.available,
    peak: totals.peak,
    minReserve: totals.minReserve,
    secondaryFuel: totals.secondaryFuel,
  };

  return (
    <div className="border-t border-slate-200 bg-white px-5 py-5" dir="rtl">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        {heading}
      </p>
      <div className="flex flex-wrap gap-6">
        {/* ── Total card ── */}
        <SummaryCard
          pill={
            <span className="inline-block px-3 py-0.5 rounded-full text-sm font-semibold border bg-orange-500 text-white border-orange-500">
              {totalLabel}
            </span>
          }
          count={totalCount}
          unitSuffix={unitSuffix}
          data={totalCard}
          containerClass="bg-orange-50 border-orange-500"
          dividerClass="bg-orange-100"
          valueClass="text-orange-900"
        />

        {/* ── Per-status cards ── */}
        {statusOrder.map((status) => {
          const data = totals.byStatus[status] ?? EMPTY;
          return (
            <SummaryCard
              key={`card-${status}`}
              pill={
                <span
                  className={`inline-block px-3 py-0.5 rounded-full text-sm font-semibold border ${colorFor(status)}`}
                >
                  {labelFor(status)}
                </span>
              }
              count={data.count}
              unitSuffix={unitSuffix}
              data={data}
              containerClass={`bg-white ${borderColorFor(status)}`}
              dividerClass="bg-slate-100"
              valueClass={valueColorFor(status)}
            />
          );
        })}

        {trailing}
      </div>
    </div>
  );
}

// ─── Internal sub-component ─────────────────────────────────────────────────

interface SummaryCardProps {
  pill: ReactNode;
  count: number;
  unitSuffix: string;
  data: StatusTotals;
  containerClass: string;
  dividerClass: string;
  valueClass: string;
}

function SummaryCard({
  pill,
  count,
  unitSuffix,
  data,
  containerClass,
  dividerClass,
  valueClass,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-xl border-2 shadow-sm px-5 py-4 flex flex-col gap-3 min-w-[240px] ${containerClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        {pill}
        <span className="text-sm text-slate-500 font-semibold">
          {count} {unitSuffix}
        </span>
      </div>
      <div className={`h-px ${dividerClass}`} />
      <div className="grid grid-cols-4 gap-x-3 text-center">
        {METRICS.map((m) => (
          <div key={m.label} className="text-xs text-slate-400 font-medium">
            {m.label}
          </div>
        ))}
        {METRICS.map((m) => (
          <div
            key={`v-${m.label}`}
            className={`text-lg font-bold mt-1 ${valueClass}`}
          >
            {m.value(data)}
          </div>
        ))}
      </div>
    </div>
  );
}
