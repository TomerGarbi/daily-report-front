"use client";

/**
 * EnergyMixPie — Chart.js doughnut showing the split of generated energy
 * by fuel type for a given ArchiveBlock.
 */

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { PieChart as PieIcon } from "lucide-react";
import { STATION_FUEL_LABELS } from "@/types/station";
import type { StationFuel } from "@/types/station";
import type { ArchiveBlock } from "@/types/report";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

const FUEL_COLORS: Record<StationFuel | "renewable", string> = {
  gas:       "#f97316",
  diesel:    "#a855f7",
  coal:      "#64748b",
  mazut:     "#92400e",
  methanol:  "#0ea5e9",
  solar:     "#facc15",
  turbine:   "#14b8a6",
  hydro:     "#06b6d4",
  wind:      "#10b981",
  nuclear:   "#eab308",
  other:     "#94a3b8",
  renewable: "#22c55e",
};

const fmt = (v: number) =>
  new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(v);

function buildSlices(block: ArchiveBlock): Slice[] {
  const out: Slice[] = [];
  for (const [fuel, mwh] of Object.entries(block.totalsMwhByFuel)) {
    if (!mwh || mwh <= 0) continue;
    const f = fuel as StationFuel;
    out.push({ key: f, label: STATION_FUEL_LABELS[f] ?? f, value: mwh, color: FUEL_COLORS[f] ?? "#94a3b8" });
  }
  if (block.renewableMwh > 0)
    out.push({ key: "renewable", label: "מתחדשת", value: block.renewableMwh, color: FUEL_COLORS.renewable });
  return out.sort((a, b) => b.value - a.value);
}

interface EnergyMixPieProps {
  block: ArchiveBlock;
  title?: string;
}

export function EnergyMixPie({ block, title = "פילוח אנרגיה לפי דלק" }: EnergyMixPieProps) {
  const slices = buildSlices(block);
  const total  = slices.reduce((s, x) => s + x.value, 0);

  const data: ChartData<"doughnut", number[], string> = {
    labels: slices.map((s) => s.label),
    datasets: [{
      data:            slices.map((s) => s.value),
      backgroundColor: slices.map((s) => s.color),
      borderColor:     "#fff",
      borderWidth:     2,
      hoverOffset:     8,
    }],
  };

  const opts: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        bodyFont: { size: 12 },
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed;
            const pct = total > 0 ? (v / total) * 100 : 0;
            return ` ${ctx.label}: ${fmt(v)} MWh (${fmt(pct)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
        <PieIcon className="h-5 w-5 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>

      {slices.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">אין נתונים להצגה</div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="relative h-[240px]">
            <Doughnut data={data} options={opts} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400">סה״כ</span>
              <span className="text-lg font-bold text-slate-800 tabular-nums">{fmt(total)}</span>
              <span className="text-[10px] text-slate-400">MWh</span>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" dir="rtl">
            {slices.map((s) => {
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <li key={s.key} className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: s.color }} />
                  <span className="flex-1 truncate text-slate-600">{s.label}</span>
                  <span className="tabular-nums text-slate-500">{fmt(pct)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
