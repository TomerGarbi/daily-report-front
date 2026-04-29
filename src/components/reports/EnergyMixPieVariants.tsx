"use client";

/**
 * EnergyMixPieVariants — multiple styled options for the energy-mix chart.
 * All variants consume an `ArchiveBlock` and use recharts.
 *
 * Pick one and replace `EnergyMixPie` import in ArchiveSection.tsx.
 */

import {
  BarChart3,
  CircleDot,
  PieChart as PieIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATION_FUEL_LABELS } from "@/types/station";
import type { StationFuel } from "@/types/station";
import type { ArchiveBlock } from "@/types/report";

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

const tooltipFormatter =
  (total: number) =>
  (value: number, name: string): [string, string] =>
    [`${fmt(value)} MWh (${fmt(total > 0 ? (value / total) * 100 : 0)}%)`, name];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  background: "#fff",
};

// ───────────────────────────────────────────────────────────────────────────
// Variant 1 — Classic donut + side legend (clean & corporate)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixPieClassic({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
        <PieIcon className="h-5 w-5 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <span className="ms-auto text-xs text-slate-400">קלאסי</span>
      </div>

      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 items-center" dir="ltr">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Tooltip formatter={tooltipFormatter(total)} contentStyle={tooltipStyle} />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null;
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan x={viewBox.cx} dy="-0.4em" className="fill-slate-400" style={{ fontSize: 11 }}>סה״כ</tspan>
                        <tspan x={viewBox.cx} dy="1.4em" className="fill-slate-800" style={{ fontSize: 18, fontWeight: 700 }}>{fmt(total)}</tspan>
                        <tspan x={viewBox.cx} dy="1.2em" className="fill-slate-400" style={{ fontSize: 10 }}>MWh</tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

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
// Variant 2 — Bold donut with shadow & gradient header (vivid)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixPieBold({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-lg">
      <div className="rounded-2xl bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-l from-indigo-50 via-violet-50 to-fuchsia-50 border-b border-violet-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <span className="ms-auto text-xs text-violet-500">מודגש</span>
        </div>

        {slices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4" dir="ltr">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {slices.map((s, i) => (
                    <linearGradient key={s.key} id={`grad-bold-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%"   stopColor={s.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <Tooltip formatter={tooltipFormatter(total)} contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  wrapperStyle={{ fontSize: 12, direction: "rtl" }}
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  cornerRadius={6}
                  stroke="#fff"
                  strokeWidth={3}
                >
                  {slices.map((_, i) => (
                    <Cell key={i} fill={`url(#grad-bold-${i})`} />
                  ))}
                  <Label
                    position="center"
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox)) return null;
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan x={viewBox.cx} dy="-0.2em" style={{ fontSize: 22, fontWeight: 800, fill: "#1e293b" }}>{fmt(total)}</tspan>
                          <tspan x={viewBox.cx} dy="1.4em" style={{ fontSize: 11, fill: "#64748b" }}>MWh סה״כ</tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant 3 — Minimal flat pie (no donut hole, light)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixPieFlat({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="rounded-2xl bg-slate-50/60 border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3">
        <CircleDot className="h-4 w-4 text-slate-400" />
        <h4 className="text-sm font-medium text-slate-600">{title}</h4>
        <span className="ms-auto text-xs text-slate-400">מינימלי</span>
      </div>
      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4" dir="ltr">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Tooltip formatter={tooltipFormatter(total)} contentStyle={tooltipStyle} />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                outerRadius={85}
                stroke="#f8fafc"
                strokeWidth={1}
                label={(entry: { label: string; value: number }) => {
                  const pct = total > 0 ? (entry.value / total) * 100 : 0;
                  return pct >= 5 ? `${fmt(pct)}%` : "";
                }}
                labelLine={false}
              >
                {slices.map((s) => <Cell key={s.key} fill={s.color} fillOpacity={0.85} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
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
// Variant 4 — Radial bar chart (modern, race-track style)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixRadial({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const max = Math.max(...slices.map((s) => s.value), 1);
  const data = slices.map((s) => ({ ...s, fill: s.color, pct: total > 0 ? (s.value / total) * 100 : 0 }));

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-l from-cyan-50 via-sky-50 to-blue-50">
        <Zap className="h-5 w-5 text-sky-600" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <span className="ms-auto text-xs text-sky-500">רדיאלי</span>
      </div>
      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4" dir="ltr">
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart
              data={data}
              innerRadius="25%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              barSize={14}
            >
              <Tooltip formatter={tooltipFormatter(total)} contentStyle={tooltipStyle} />
              <RadialBar
                dataKey="value"
                background={{ fill: "#f1f5f9" }}
                cornerRadius={8}
                max={max}
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: 12, direction: "rtl", paddingLeft: 12 }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant 5 — Horizontal bar chart (best for many fuel types)
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixBar({ block, title = "פילוח אנרגיה לפי דלק" }: VariantProps) {
  const slices = buildSlices(block);
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
        <BarChart3 className="h-5 w-5 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <span className="ms-auto text-xs text-slate-400">עמודות</span>
      </div>
      {slices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4" dir="ltr">
          <ResponsiveContainer width="100%" height={Math.max(180, slices.length * 36)}>
            <BarChart
              data={slices}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={90}
                tick={{ fontSize: 12, fill: "#475569" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={tooltipFormatter(total)} contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center text-xs text-slate-500">
            סה״כ: <span className="font-semibold text-slate-700 tabular-nums">{fmt(total)}</span> MWh
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Showcase — renders all variants stacked, for visual comparison
// ───────────────────────────────────────────────────────────────────────────

export function EnergyMixPieShowcase({ block }: { block: ArchiveBlock }) {
  return (
    <div className="space-y-4" dir="rtl">
      <p className="text-xs text-slate-500">
        בחר סגנון. לאחר בחירה, החלף את הייבוא ב־ArchiveSection.tsx ל־<code className="bg-slate-100 px-1 rounded">EnergyMixPie&lt;Variant&gt;</code>.
      </p>
      <EnergyMixPieClassic  block={block} title="1 — קלאסי (דונאט + מקרא צד)" />
      <EnergyMixPieBold     block={block} title="2 — מודגש (גרדיאנט + הילה)" />
      <EnergyMixPieFlat     block={block} title="3 — מינימלי (פאי שטוח)" />
      <EnergyMixRadial      block={block} title="4 — רדיאלי (race-track)" />
      <EnergyMixBar         block={block} title="5 — עמודות אופקיות" />
    </div>
  );
}
