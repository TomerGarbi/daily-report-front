"use client";

/**
 * EnergyMixChartJsVariants — same data, multiple Chart.js styled options
 * built on react-chartjs-2. Pick one and import it in ArchiveSection.tsx.
 */

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  RadialLinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut, Pie, PolarArea } from "react-chartjs-2";
import { BarChart3, CircleDot, PieChart as PieIcon, Sparkles, Zap } from "lucide-react";
import { STATION_FUEL_LABELS } from "@/types/station";
import type { StationFuel } from "@/types/station";
import type { ArchiveBlock } from "@/types/report";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, RadialLinearScale, Tooltip, Legend);

// ─── Shared helpers ─────────────────────────────────────────────────────────

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

const FUEL_COLORS: Record<StationFuel | "renewable", string> = {
  gas:       "#f97316",
  diesel:    "#a855f7",
  coal:      "#475569",
  mazut:     "#92400e",
  methanol:  "#0ea5e9",
  solar:     "#facc15",
  turbine:   "#14b8a6",
  hydro:     "#3b82f6",
  wind:      "#10b981",
  nuclear:   "#eab308",
  other:     "#94a3b8",
  renewable: "#22c55e",
};

function buildSlices(block: ArchiveBlock): Slice[] {
  const out: Slice[] = [];
  for (const [fuel, mwh] of Object.entries(block.totalsMwhByFuel)) {
    if (!mwh || mwh <= 0) continue;
    const f = fuel as StationFuel;
    out.push({
      key: f,
      label: STATION_FUEL_LABELS[f] ?? f,
      value: mwh,
      color: FUEL_COLORS[f] ?? "#94a3b8",
    });
  }
  if (block.renewableMwh > 0) {
    out.push({
      key: "renewable",
      label: "אנרגיה מתחדשת",
      value: block.renewableMwh,
      color: FUEL_COLORS.renewable,
    });
  }
  return out.sort((a, b) => b.value - a.value);
}

const fmt = (v: number) =>
  new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(v);

interface VariantProps {
  block: ArchiveBlock;
  title?: string;
}

function EmptyState() {
  return (
    <div className="px-5 py-10 text-center text-sm text-slate-400">
      אין נתונים להצגה
    </div>
  );
}

const tooltipCallbacks = (total: number) => ({
  label: (ctx: { label?: string; parsed: unknown }) => {
    const p = ctx.parsed;
    let v = 0;
    if (typeof p === "number") v = p;
    else if (p && typeof p === "object") {
      const o = p as { r?: number; x?: number; y?: number };
      v = o.r ?? o.x ?? o.y ?? 0;
    }
    const pct = total > 0 ? (v / total) * 100 : 0;
    return ` ${ctx.label ?? ""}: ${fmt(v)} MWh (${fmt(pct)}%)`;
  },
});

// ───────────────────────────────────────────────────────────────────────────
// Variant 1 — Doughnut + side legend (clean & corporate)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixChartJsClassic({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  const data: ChartData<"doughnut", number[], string> = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color),
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: tooltipCallbacks(total), rtl: true, bodyFont: { size: 12 } },
    },
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
        <PieIcon className="h-5 w-5 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <span className="ms-auto text-xs text-slate-400">קלאסי · Chart.js</span>
      </div>
      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 items-center">
          <div className="relative h-[240px]">
            <Doughnut data={data} options={options} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-slate-400">סה״כ</span>
              <span className="text-lg font-bold text-slate-800 tabular-nums">{fmt(total)}</span>
              <span className="text-[10px] text-slate-400">MWh</span>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm" dir="rtl">
            {slices.map((s) => {
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span className="h-3 w-3 flex-none rounded-sm" style={{ background: s.color }} />
                  <span className="flex-1 text-slate-700">{s.label}</span>
                  <span className="tabular-nums text-slate-500 text-xs">{fmt(pct)}%</span>
                  <span className="tabular-nums font-semibold text-slate-800 w-20 text-end">{fmt(s.value)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant 2 — Bold doughnut with gradient frame (vivid)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixChartJsBold({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  const data: ChartData<"doughnut", number[], string> = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color),
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 12,
        spacing: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        rtl: true,
        labels: { boxWidth: 12, boxHeight: 12, font: { size: 12 }, padding: 12 },
      },
      tooltip: { callbacks: tooltipCallbacks(total), rtl: true },
    },
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-lg">
      <div className="rounded-2xl bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-l from-indigo-50 via-violet-50 to-fuchsia-50 border-b border-violet-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <span className="ms-auto text-xs text-violet-500">מודגש · Chart.js</span>
        </div>
        {slices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4">
            <div className="relative h-[290px]">
              <Doughnut data={data} options={options} />
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] flex flex-col items-center">
                <span className="text-2xl font-extrabold text-slate-800 tabular-nums">{fmt(total)}</span>
                <span className="text-[11px] text-slate-500">MWh סה״כ</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant 3 — Minimal flat pie (no donut hole, light)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixChartJsFlat({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  const data: ChartData<"pie", number[], string> = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color + "DD"),
        borderColor: "#f8fafc",
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: tooltipCallbacks(total), rtl: true },
    },
  };

  return (
    <div className="rounded-2xl bg-slate-50/60 border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3">
        <CircleDot className="h-4 w-4 text-slate-400" />
        <h4 className="text-sm font-medium text-slate-600">{title}</h4>
        <span className="ms-auto text-xs text-slate-400">מינימלי · Chart.js</span>
      </div>
      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4">
          <div className="h-[220px]">
            <Pie data={data} options={options} />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500" dir="rtl">
            {slices.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant 4 — Polar area chart (Chart.js exclusive, modern look)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixChartJsPolar({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  const data: ChartData<"polarArea", number[], string> = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color + "B3"),
        borderColor: slices.map((s) => s.color),
        borderWidth: 1.5,
      },
    ],
  };

  const options: ChartOptions<"polarArea"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: { display: false, backdropColor: "transparent" },
        grid: { color: "#e2e8f0" },
        angleLines: { color: "#e2e8f0" },
      },
    },
    plugins: {
      legend: {
        position: "right",
        rtl: true,
        labels: { boxWidth: 10, boxHeight: 10, font: { size: 12 }, padding: 8 },
      },
      tooltip: { callbacks: tooltipCallbacks(total), rtl: true },
    },
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-l from-cyan-50 via-sky-50 to-blue-50">
        <Zap className="h-5 w-5 text-sky-600" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <span className="ms-auto text-xs text-sky-500">פולארי · Chart.js</span>
      </div>
      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4">
          <div className="h-[260px]">
            <PolarArea data={data} options={options} />
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant 5 — Horizontal bar chart
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixChartJsBar({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  const data: ChartData<"bar", number[], string> = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color),
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 18,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false, grid: { display: false } },
      y: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: "#475569" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: tooltipCallbacks(total), rtl: true },
    },
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
        <BarChart3 className="h-5 w-5 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <span className="ms-auto text-xs text-slate-400">עמודות · Chart.js</span>
      </div>
      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4">
          <div style={{ height: Math.max(180, slices.length * 36) }}>
            <Bar data={data} options={options} />
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            סה״כ: <span className="font-semibold text-slate-700 tabular-nums">{fmt(total)}</span> MWh
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Showcase
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixChartJsShowcase({ block }: { block: ArchiveBlock }) {
  return (
    <div className="space-y-4" dir="rtl">
      <p className="text-xs text-slate-500">
        גרסאות Chart.js. בחר אחת והחלף את הייבוא ב־ArchiveSection.tsx.
      </p>
      <EnergyMixChartJsClassic block={block} title="1 — דונאט קלאסי + מקרא צד" />
      <EnergyMixChartJsBold    block={block} title="2 — דונאט מודגש (גרדיאנט)" />
      <EnergyMixChartJsFlat    block={block} title="3 — פאי שטוח מינימלי" />
      <EnergyMixChartJsPolar   block={block} title="4 — פולארי (Polar Area)" />
      <EnergyMixChartJsBar     block={block} title="5 — עמודות אופקיות" />
    </div>
  );
}
