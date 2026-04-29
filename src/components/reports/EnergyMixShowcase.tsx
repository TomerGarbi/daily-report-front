"use client";

/**
 * EnergyMixShowcase — renders all Recharts variants next to all Chart.js
 * variants for visual comparison. Each row is one style with both libraries
 * side-by-side.
 */

import type { ArchiveBlock } from "@/types/report";
import {
  EnergyMixPieClassic,
  EnergyMixPieBold,
  EnergyMixPieFlat,
  EnergyMixRadial,
  EnergyMixBar,
} from "./EnergyMixPieVariants";
import {
  EnergyMixChartJsClassic,
  EnergyMixChartJsBold,
  EnergyMixChartJsFlat,
  EnergyMixChartJsPolar,
  EnergyMixChartJsBar,
} from "./EnergyMixChartJsVariants";

interface RowProps {
  label: string;
  recharts: React.ReactNode;
  chartjs: React.ReactNode;
}

function Row({ label, recharts, chartjs }: RowProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 px-1">{label}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 px-1">Recharts</div>
          {recharts}
        </div>
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 px-1">Chart.js</div>
          {chartjs}
        </div>
      </div>
    </div>
  );
}

export function EnergyMixShowcase({ block }: { block: ArchiveBlock }) {
  return (
    <div className="space-y-8" dir="rtl">
      <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 text-sm text-amber-900">
        <p className="font-semibold">השוואת סגנונות — Recharts מול Chart.js</p>
        <p className="mt-0.5 text-amber-800/80">
          בחר את הסגנון המועדף ואני אחבר אותו ל־ArchiveSection.
        </p>
      </div>

      <Row
        label="1 — קלאסי (דונאט + מקרא צד)"
        recharts={<EnergyMixPieClassic block={block} title="Recharts" />}
        chartjs={<EnergyMixChartJsClassic block={block} title="Chart.js" />}
      />
      <Row
        label="2 — מודגש (גרדיאנט)"
        recharts={<EnergyMixPieBold block={block} title="Recharts" />}
        chartjs={<EnergyMixChartJsBold block={block} title="Chart.js" />}
      />
      <Row
        label="3 — מינימלי (פאי שטוח)"
        recharts={<EnergyMixPieFlat block={block} title="Recharts" />}
        chartjs={<EnergyMixChartJsFlat block={block} title="Chart.js" />}
      />
      <Row
        label="4 — רדיאלי / פולארי"
        recharts={<EnergyMixRadial block={block} title="Recharts (RadialBar)" />}
        chartjs={<EnergyMixChartJsPolar block={block} title="Chart.js (Polar Area)" />}
      />
      <Row
        label="5 — עמודות אופקיות"
        recharts={<EnergyMixBar block={block} title="Recharts" />}
        chartjs={<EnergyMixChartJsBar block={block} title="Chart.js" />}
      />
    </div>
  );
}
