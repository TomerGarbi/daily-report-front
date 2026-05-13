"use client";

/**
 * ArchiveSection.tsx
 *
 * Controlled editable form for the "archive" (yesterday) stepper section.
 * Follows the same value/onChange/readOnly pattern as ForecastSection.
 *
 * - While `value` is undefined the SWR hook auto-prefills once when data
 *   arrives from `GET /api/v1/reports/archive/yesterday`.
 * - A "טען נתונים מהמערכת" button re-applies remote data over current values.
 * - In `readOnly` mode all inputs become static text (no SWR fetch).
 */

import { useEffect, useRef } from "react";
import {
  Archive,
  Calendar,
  Clock,
  Zap,
  Building2,
  Factory,
  Flame,
  Fuel,
  Mountain,
  Leaf,
  Thermometer,
  Droplets,
  CloudSun,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Gauge,
  Sigma,
  Plus,
  X,
} from "lucide-react";
import { useYesterdayArchive } from "@/hooks/useYesterdayArchive";
import { useLastYearArchive } from "@/hooks/useLastYearArchive";
import { useArchiveForDate } from "@/hooks/useArchiveForDate";
import { FieldText } from "@/components/inputs/FieldText";
import { Button } from "@/components/ui/button";
import { STATION_FUEL_LABELS } from "@/types/station";
import type { StationFuel } from "@/types/station";
import type { ArchiveBlock, ArchiveData, LastYearArchiveBlock, LastYearArchiveData } from "@/types/report";
import { emptyArchiveBlock, emptyLastYearArchiveBlock } from "@/types/report";

// ─── Helpers ────────────────────────────────────────────────────────────────

function archiveBlockFromApiData(d: ArchiveData): ArchiveBlock {
  return {
    date:                d.date,
    dayName:             d.dayName,
    peakConsumptionHour: d.peakConsumptionHour ?? "",
    totalsMwhByFuel:     d.totalsMwhByFuel,
    renewableMwh:        d.renewableMwh,
    totalIecMwh:         d.totalIecMwh    ?? 0,
    totalPrivateMwh:     d.totalPrivateMwh ?? 0,
    weather: {
      temperatureC: d.weather?.temperatureC ?? 0,
      feelsLikeC:   d.weather?.feelsLikeC   ?? 0,
      humidityPct:  d.weather?.humidityPct  ?? 0,
    },
  };
}

const fmtDate = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const numStr = (v: number): string => (Number.isFinite(v) ? String(v) : "0");

// Compute the calendar day immediately before the given ISO date string.
const prevDayIso = (iso: string): string => {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const dayNameFor = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(new Date(iso));
  } catch {
    return "";
  }
};

const emptyBlockForDate = (iso: string): ArchiveBlock => ({
  date:                iso,
  dayName:             dayNameFor(iso),
  peakConsumptionHour: "",
  totalsMwhByFuel:     {},
  renewableMwh:        0,
  totalIecMwh:         0,
  totalPrivateMwh:     0,
  weather: { temperatureC: 0, feelsLikeC: 0, humidityPct: 0 },
});

// ─── Row config ─────────────────────────────────────────────────────────────

interface EnergyRowConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  getValue: (b: ArchiveBlock) => number;
  setValue: (b: ArchiveBlock, v: number) => ArchiveBlock;
}

const fuelRow = (
  fuel: StationFuel,
  icon: React.ElementType,
): EnergyRowConfig => ({
  key: fuel,
  label: STATION_FUEL_LABELS[fuel],
  icon,
  getValue: (b) => b.totalsMwhByFuel[fuel] ?? 0,
  setValue: (b, v) => ({
    ...b,
    totalsMwhByFuel: { ...b.totalsMwhByFuel, [fuel]: v },
  }),
});

const ENERGY_ROWS: EnergyRowConfig[] = [
  {
    key: "iec",
    label: "סה״כ ייצור חברת חשמל",
    icon: Building2,
    getValue: (b) => b.totalIecMwh,
    setValue: (b, v) => ({ ...b, totalIecMwh: v }),
  },
  {
    key: "private",
    label: "סה״כ ייצור יחידות פרטיות",
    icon: Factory,
    getValue: (b) => b.totalPrivateMwh,
    setValue: (b, v) => ({ ...b, totalPrivateMwh: v }),
  },
  fuelRow("gas",      Flame),
  fuelRow("diesel",   Fuel),
  fuelRow("coal",     Mountain),
  fuelRow("mazut",    Fuel),
  fuelRow("methanol", Fuel),
  {
    key: "renewable",
    label: "אנרגיה מתחדשת",
    icon: Leaf,
    getValue: (b) => b.renewableMwh,
    setValue: (b, v) => ({ ...b, renewableMwh: v }),
  },
];

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ArchiveSectionProps {
  value?:    ArchiveBlock;
  onChange?: (next: ArchiveBlock) => void;
  /** Additional historical days, ordered most-recent first (yesterday-1, yesterday-2, ...). */
  extraDays?:         ArchiveBlock[];
  onExtraDaysChange?: (next: ArchiveBlock[]) => void;
  /** Editable last-year block. When `onLastYearChange` is provided the panel
   *  renders as an editable form; otherwise it falls back to read-only display. */
  lastYearValue?:    LastYearArchiveBlock;
  onLastYearChange?: (next: LastYearArchiveBlock) => void;
  readOnly?: boolean;
  /** When false the SWR hook is disabled (e.g. before the user opens the step). */
  enabled?:  boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ArchiveSection({
  value,
  onChange,
  extraDays,
  onExtraDaysChange,
  lastYearValue,
  onLastYearChange,
  readOnly,
  enabled = true,
}: ArchiveSectionProps) {
  const { archive: apiData, isLoading } = useYesterdayArchive(enabled && !readOnly);
  // Last-year panel always fetches when the section is visible — it's read-only
  // and not tied to the report being editable.
  const { lastYear, isLoading: lastYearLoading } = useLastYearArchive(enabled);

  // Auto-prefill once when API data arrives and the block hasn't been set yet.
  const prefillApplied = useRef(false);
  useEffect(() => {
    if (!apiData || !onChange || prefillApplied.current) return;
    if (value?.peakConsumptionHour) return; // already has user data
    prefillApplied.current = true;
    onChange(archiveBlockFromApiData(apiData));
  }, [apiData, onChange, value?.peakConsumptionHour]);

  const applyServerData = () => {
    if (!apiData || !onChange) return;
    prefillApplied.current = true;
    onChange(archiveBlockFromApiData(apiData));
  };

  // ── Extra-day helpers ───────────────────────────────────────────────────
  const days = extraDays ?? [];
  const handleAddDay = () => {
    if (!onExtraDaysChange) return;
    const baseIso = days.length
      ? days[days.length - 1].date
      : (block.date || emptyArchiveBlock().date);
    const newIso = prevDayIso(baseIso);
    onExtraDaysChange([...days, emptyBlockForDate(newIso)]);
  };
  const handleUpdateDay = (idx: number, next: ArchiveBlock) => {
    if (!onExtraDaysChange) return;
    onExtraDaysChange(days.map((d, i) => (i === idx ? next : d)));
  };
  const handleRemoveDay = (idx: number) => {
    if (!onExtraDaysChange) return;
    onExtraDaysChange(days.filter((_, i) => i !== idx));
  };

  // ── Loading skeleton (only while waiting for first prefill) ────────────
  if (isLoading && !value && !readOnly) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
        <div className="space-y-6">
          <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <LastYearPanel data={lastYear} isLoading={lastYearLoading} value={lastYearValue} onChange={onLastYearChange} readOnly={readOnly} />
      </div>
    );
  }

  const block: ArchiveBlock = value ?? emptyArchiveBlock();
  const set = (next: ArchiveBlock) => onChange?.(next);

  const serverDataAvailable = Boolean(apiData?.hasData);
  const showEmptyNotice = !readOnly && !serverDataAvailable && !value?.peakConsumptionHour;

  // ─── Read-only variant ────────────────────────────────────────────────
  if (readOnly) {
    const fmtNum = (v: number) =>
      new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(v);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
        <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-slate-50 via-zinc-50 to-stone-50 ring-1 ring-slate-200 shadow-sm p-6">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-slate-400 via-zinc-400 to-stone-400" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 via-zinc-500 to-stone-500 text-white shadow-sm">
              <Archive className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800">ארכיון – נתוני אתמול</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
                {block.date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    {fmtDate(block.date)}
                  </span>
                )}
                {block.dayName && (
                  <span className="font-medium text-slate-700">{block.dayName}</span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-500" />
                  שעת שיא:&nbsp;
                  <span className="font-semibold text-slate-800">
                    {block.peakConsumptionHour || "—"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Energy totals */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
            <Zap className="h-5 w-5 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-700">סה״כ אנרגיה שיוצרה אתמול</h4>
          </div>
          <ul className="divide-y divide-slate-100">
            {ENERGY_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.key} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-700">{row.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-semibold text-slate-800 tabular-nums">
                      {fmtNum(row.getValue(block))}
                    </span>
                    <span className="text-xs text-slate-500">MWh</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Weather */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-l from-sky-50 via-blue-50 to-cyan-50">
            <CloudSun className="h-5 w-5 text-sky-600" />
            <h4 className="text-sm font-semibold text-slate-700">מזג אוויר בשעת השיא</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
            <ReadOnlyWeatherStat icon={Thermometer} label="טמפרטורה"  value={block.weather.temperatureC} unit="°C" accent="text-orange-600" bg="bg-orange-50/70" ring="ring-orange-100" />
            <ReadOnlyWeatherStat icon={Thermometer} label="טמפ׳ מורגשת" value={block.weather.feelsLikeC} unit="°C" accent="text-rose-600"   bg="bg-rose-50/70"   ring="ring-rose-100" />
            <ReadOnlyWeatherStat icon={Droplets}    label="לחות"       value={block.weather.humidityPct}  unit="%" accent="text-sky-700"   bg="bg-sky-50/70"    ring="ring-sky-100" />
          </div>
        </div>

        {/* Extra historical days (read-only) */}
        {days.map((d, i) => (
          <ReadOnlyExtraDayCard key={d.date || i} block={d} />
        ))}
        </div>
        <LastYearPanel data={lastYear} isLoading={lastYearLoading} value={lastYearValue} onChange={onLastYearChange} readOnly={readOnly} />
      </div>
    );
  }

  // ─── Editable variant ─────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
      <div className="space-y-6">
      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-slate-50 via-zinc-50 to-stone-50 ring-1 ring-slate-200 shadow-sm p-6">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-slate-400 via-zinc-400 to-stone-400" />
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 via-zinc-500 to-stone-500 text-white shadow-sm">
            <Archive className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
              <h3 className="text-base font-semibold text-slate-800">ארכיון – נתוני אתמול</h3>
              {block.date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {fmtDate(block.date)}
                </span>
              )}
              {block.dayName && (
                <span className="font-medium text-slate-700">{block.dayName}</span>
              )}
            </div>
            <div className="flex items-end gap-3">
              <div className="w-40">
                <FieldText
                  label="שעת שיא"
                  placeholder="14:30"
                  value={block.peakConsumptionHour}
                  onChange={(e) => set({ ...block, peakConsumptionHour: e.target.value })}
                  startIcon={<Clock className="h-4 w-4" />}
                  dir="ltr"
                />
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyServerData}
                  disabled={!apiData}
                  className="gap-1.5 h-9 text-xs whitespace-nowrap"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  טען נתונים מהמערכת
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── No-data notice ───────────────────────────────────────────────── */}
      {showEmptyNotice && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 text-amber-900">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-none text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">אין נתונים לשלשום</p>
            <p className="mt-0.5 text-amber-800/80">לא ניתן היה לטעון נתונים מהמערכת. ניתן להזין ידנית.</p>
          </div>
        </div>
      )}

      {/* ── Energy totals ────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
          <Zap className="h-5 w-5 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">סה״כ אנרגיה שיוצרה אתמול</h4>
        </div>
        <ul className="divide-y divide-slate-100">
            {ENERGY_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.key} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50/60">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700">{row.label}</span>
                  <div className="w-28">
                    <FieldText
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      value={numStr(row.getValue(block))}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        set(row.setValue(block, Number.isFinite(v) ? v : 0));
                      }}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <span className="w-8 text-xs text-slate-500 text-right">MWh</span>
                </li>
              );
            })}
        </ul>
      </div>

      {/* ── Weather at peak hour ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-l from-sky-50 via-blue-50 to-cyan-50">
          <CloudSun className="h-5 w-5 text-sky-600" />
          <h4 className="text-sm font-semibold text-slate-700">מזג אוויר בשעת השיא</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
          <FieldText
            label="טמפרטורה (°C)"
            type="number"
            step="0.1"
            placeholder="0"
            value={numStr(block.weather.temperatureC)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              set({ ...block, weather: { ...block.weather, temperatureC: Number.isFinite(v) ? v : 0 } });
            }}
            startIcon={<Thermometer className="h-4 w-4" />}
            dir="ltr"
          />
          <FieldText
            label="טמפ׳ מורגשת (°C)"
            type="number"
            step="0.1"
            placeholder="0"
            value={numStr(block.weather.feelsLikeC)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              set({ ...block, weather: { ...block.weather, feelsLikeC: Number.isFinite(v) ? v : 0 } });
            }}
            startIcon={<Thermometer className="h-4 w-4" />}
            dir="ltr"
          />
          <FieldText
            label="לחות (%)"
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={numStr(block.weather.humidityPct)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              set({ ...block, weather: { ...block.weather, humidityPct: Number.isFinite(v) ? v : 0 } });
            }}
            startIcon={<Droplets className="h-4 w-4" />}
            dir="ltr"
          />
        </div>
      </div>

      {/* ── Extra historical days (editable, stacked) ──────────────────────── */}
      {days.map((d, i) => (
        <ExtraDayCard
          key={d.date || i}
          block={d}
          onChange={(next) => handleUpdateDay(i, next)}
          onRemove={() => handleRemoveDay(i)}
        />
      ))}

      {/* ── Add day button ───────────────────────────────────────────────── */}
      {onExtraDaysChange && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddDay}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            הוסף יום
          </Button>
        </div>
      )}
      </div>
      <LastYearPanel data={lastYear} isLoading={lastYearLoading} value={lastYearValue} onChange={onLastYearChange} readOnly={readOnly} />
    </div>
  );
}

// ─── Read-only weather stat ──────────────────────────────────────────────────

interface ReadOnlyWeatherStatProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  accent: string;
  bg: string;
  ring: string;
}

function ReadOnlyWeatherStat({ icon: Icon, label, value, unit, accent, bg, ring }: ReadOnlyWeatherStatProps) {
  const display = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(value);
  return (
    <div className={`rounded-xl ${bg} ring-1 ${ring} px-4 py-3 flex items-center gap-3`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-lg font-semibold ${accent} tabular-nums`}>
          {display}
          <span className="text-xs font-normal text-slate-500 mr-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}


// ─── Last-year panel (editable) ─────────────────────────────────────────────

interface LastYearPanelProps {
  data: LastYearArchiveData | null;
  isLoading: boolean;
  value?:    LastYearArchiveBlock;
  onChange?: (next: LastYearArchiveBlock) => void;
  readOnly?: boolean;
}

function lastYearBlockFromApiData(d: LastYearArchiveData): LastYearArchiveBlock {
  return {
    date:                d.date,
    dayName:             d.dayName,
    peakConsumptionHour: d.peakConsumptionHour ?? "",
    peakConsumptionMw:   d.peakConsumptionMw   ?? 0,
    totalIecMwh:         d.totalIecMwh         ?? 0,
    totalPrivateMwh:     d.totalPrivateMwh     ?? 0,
    totalMwh:            d.totalMwh            ?? 0,
    weather: {
      temperatureC: d.weather?.temperatureC ?? 0,
      feelsLikeC:   d.weather?.feelsLikeC   ?? 0,
      humidityPct:  d.weather?.humidityPct  ?? 0,
    },
    ytdEnergyGrowthPct:  d.ytdEnergyGrowthPct  ?? 0,
  };
}

function LastYearPanel({ data, isLoading, value, onChange, readOnly }: LastYearPanelProps) {
  const fmtNum = (v: number) =>
    new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(v);

  // Auto-prefill once when API data arrives and no value yet.
  const prefillApplied = useRef(false);
  useEffect(() => {
    if (!data || !onChange || prefillApplied.current) return;
    if (value?.peakConsumptionHour) return;
    prefillApplied.current = true;
    onChange(lastYearBlockFromApiData(data));
  }, [data, onChange, value?.peakConsumptionHour]);

  const applyServerData = () => {
    if (!data || !onChange) return;
    prefillApplied.current = true;
    onChange(lastYearBlockFromApiData(data));
  };

  // While waiting for first prefill in editable mode, show skeleton.
  if (isLoading && !value && !readOnly) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  const block: LastYearArchiveBlock = value ?? emptyLastYearArchiveBlock();
  const set = (next: LastYearArchiveBlock) => onChange?.(next);

  const yearLabel = (() => {
    if (!block.date) return "";
    try {
      return new Date(block.date).getFullYear().toString();
    } catch {
      return "";
    }
  })();

  // ── Read-only variant ────────────────────────────────────────────────
  if (readOnly) {
    const growth = block.ytdEnergyGrowthPct;
    const GrowthIcon = growth > 0 ? TrendingUp : growth < 0 ? TrendingDown : Minus;
    const growthClass =
      growth > 0 ? "text-emerald-700 bg-emerald-50 ring-emerald-200" :
      growth < 0 ? "text-rose-700 bg-rose-50 ring-rose-200" :
                   "text-slate-500 bg-slate-100 ring-slate-200";

    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-50 via-violet-50 to-fuchsia-50 ring-1 ring-indigo-200 shadow-sm p-6">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-indigo-400 via-violet-400 to-fuchsia-400" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-sm">
              <History className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800">
                אשתקד {yearLabel && <span className="text-slate-500 font-normal">({yearLabel})</span>}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
                {block.date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    {fmtDate(block.date)}
                  </span>
                )}
                {block.dayName && (
                  <span className="font-medium text-slate-700">{block.dayName}</span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-500" />
                  שעת שיא:&nbsp;
                  <span className="font-semibold text-slate-800">
                    {block.peakConsumptionHour || "—"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
            <Zap className="h-5 w-5 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-700">צריכה וייצור אשתקד</h4>
          </div>
          <ul className="divide-y divide-slate-100">
            <ReadOnlyStatRow icon={Gauge}    label="שיא צריכה"               value={block.peakConsumptionMw} unit="MW" />
            <ReadOnlyStatRow icon={Building2} label="סה״כ ייצור חברת חשמל"     value={block.totalIecMwh}      unit="MWh" />
            <ReadOnlyStatRow icon={Factory}   label="סה״כ ייצור יחידות פרטיות"   value={block.totalPrivateMwh}  unit="MWh" />
            <ReadOnlyStatRow icon={Sigma}     label="סה״כ אנרגיה"               value={block.totalMwh}         unit="MWh" />
            <li className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <GrowthIcon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">גידול בצריכה מתחילת השנה</span>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold ring-1 ${growthClass}`}>
                {`${growth > 0 ? "+" : ""}${fmtNum(growth)}%`}
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-l from-sky-50 via-blue-50 to-cyan-50">
            <CloudSun className="h-5 w-5 text-sky-600" />
            <h4 className="text-sm font-semibold text-slate-700">מזג אוויר בשעת השיא</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
            <ReadOnlyWeatherStat icon={Thermometer} label="טמפרטורה"   value={block.weather.temperatureC} unit="°C" accent="text-orange-600" bg="bg-orange-50/70" ring="ring-orange-100" />
            <ReadOnlyWeatherStat icon={Thermometer} label="טמפ׳ מורגשת" value={block.weather.feelsLikeC}   unit="°C" accent="text-rose-600"   bg="bg-rose-50/70"   ring="ring-rose-100" />
            <ReadOnlyWeatherStat icon={Droplets}    label="לחות"        value={block.weather.humidityPct}  unit="%"  accent="text-sky-700"    bg="bg-sky-50/70"    ring="ring-sky-100" />
          </div>
        </div>
      </div>
    );
  }

  // ── Editable variant ─────────────────────────────────────────────────
  const serverDataAvailable = Boolean(data?.hasData);
  const showEmptyNotice = !serverDataAvailable && !value?.peakConsumptionHour;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-50 via-violet-50 to-fuchsia-50 ring-1 ring-indigo-200 shadow-sm p-6">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-indigo-400 via-violet-400 to-fuchsia-400" />
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-sm">
            <History className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
              <h3 className="text-base font-semibold text-slate-800">
                אשתקד {yearLabel && <span className="text-slate-500 font-normal">({yearLabel})</span>}
              </h3>
              {block.date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {fmtDate(block.date)}
                </span>
              )}
              {block.dayName && (
                <span className="font-medium text-slate-700">{block.dayName}</span>
              )}
            </div>
            <div className="flex items-end gap-3">
              <div className="w-40">
                <FieldText
                  label="שעת שיא"
                  placeholder="14:30"
                  value={block.peakConsumptionHour}
                  onChange={(e) => set({ ...block, peakConsumptionHour: e.target.value })}
                  startIcon={<Clock className="h-4 w-4" />}
                  dir="ltr"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyServerData}
                disabled={!data}
                className="gap-1.5 h-9 text-xs whitespace-nowrap"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                טען נתונים מהמערכת
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* No-data notice */}
      {showEmptyNotice && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 text-amber-900">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-none text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">אין נתונים לאותו יום אשתקד</p>
            <p className="mt-0.5 text-amber-800/80">לא ניתן היה לטעון נתונים מהמערכת. ניתן להזין ידנית.</p>
          </div>
        </div>
      )}

      {/* Energy + peak (editable) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
          <Zap className="h-5 w-5 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">צריכה וייצור אשתקד</h4>
        </div>
        <ul className="divide-y divide-slate-100">
          <EditableStatRow icon={Gauge}     label="שיא צריכה"               value={block.peakConsumptionMw} unit="MW"
            onChange={(v) => set({ ...block, peakConsumptionMw: v })} />
          <EditableStatRow icon={Building2} label="סה״כ ייצור חברת חשמל"     value={block.totalIecMwh}       unit="MWh"
            onChange={(v) => set({ ...block, totalIecMwh: v })} />
          <EditableStatRow icon={Factory}   label="סה״כ ייצור יחידות פרטיות"   value={block.totalPrivateMwh}   unit="MWh"
            onChange={(v) => set({ ...block, totalPrivateMwh: v })} />
          <EditableStatRow icon={Sigma}     label="סה״כ אנרגיה"               value={block.totalMwh}          unit="MWh"
            onChange={(v) => set({ ...block, totalMwh: v })} />
          <EditableStatRow icon={TrendingUp} label="גידול בצריכה מתחילת השנה" value={block.ytdEnergyGrowthPct} unit="%"
            allowNegative
            onChange={(v) => set({ ...block, ytdEnergyGrowthPct: v })} />
        </ul>
      </div>

      {/* Weather (editable) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-gradient-to-l from-sky-50 via-blue-50 to-cyan-50">
          <CloudSun className="h-5 w-5 text-sky-600" />
          <h4 className="text-sm font-semibold text-slate-700">מזג אוויר בשעת השיא</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
          <FieldText
            label="טמפרטורה (°C)"
            type="number"
            step="0.1"
            placeholder="0"
            value={numStr(block.weather.temperatureC)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              set({ ...block, weather: { ...block.weather, temperatureC: Number.isFinite(v) ? v : 0 } });
            }}
            startIcon={<Thermometer className="h-4 w-4" />}
            dir="ltr"
          />
          <FieldText
            label="טמפ׳ מורגשת (°C)"
            type="number"
            step="0.1"
            placeholder="0"
            value={numStr(block.weather.feelsLikeC)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              set({ ...block, weather: { ...block.weather, feelsLikeC: Number.isFinite(v) ? v : 0 } });
            }}
            startIcon={<Thermometer className="h-4 w-4" />}
            dir="ltr"
          />
          <FieldText
            label="לחות (%)"
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={numStr(block.weather.humidityPct)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              set({ ...block, weather: { ...block.weather, humidityPct: Number.isFinite(v) ? v : 0 } });
            }}
            startIcon={<Droplets className="h-4 w-4" />}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Editable / read-only stat rows ─────────────────────────────────────────

interface EditableStatRowProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  allowNegative?: boolean;
  onChange: (v: number) => void;
}

function EditableStatRow({ icon: Icon, label, value, unit, allowNegative, onChange }: EditableStatRowProps) {
  return (
    <li className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
      <div className="w-32">
        <FieldText
          type="number"
          min={allowNegative ? undefined : 0}
          step="any"
          placeholder="0"
          value={numStr(value)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? v : 0);
          }}
          dir="ltr"
          className="text-left"
        />
      </div>
      <span className="w-8 text-xs text-slate-500 text-right">{unit}</span>
    </li>
  );
}

interface ReadOnlyStatRowProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
}

function ReadOnlyStatRow({ icon: Icon, label, value, unit }: ReadOnlyStatRowProps) {
  const fmtNum = (v: number) =>
    new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(v);
  return (
    <li className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-semibold text-slate-800 tabular-nums">{fmtNum(value)}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </li>
  );
}


// ─── Extra-day editable card ────────────────────────────────────────────────

interface ExtraDayCardProps {
  block: ArchiveBlock;
  onChange: (next: ArchiveBlock) => void;
  onRemove: () => void;
}

function ExtraDayCard({ block, onChange, onRemove }: ExtraDayCardProps) {
  // Auto-prefill once when server data arrives for this date.
  const dateKey = block.date ? block.date.slice(0, 10) : null;
  const { archive: apiData } = useArchiveForDate(dateKey);
  const prefillApplied = useRef(false);

  useEffect(() => {
    if (!apiData || prefillApplied.current) return;
    if (block.peakConsumptionHour) return;
    prefillApplied.current = true;
    onChange({
      ...block,
      peakConsumptionHour: apiData.peakConsumptionHour ?? "",
      totalsMwhByFuel:     apiData.totalsMwhByFuel,
      renewableMwh:        apiData.renewableMwh,
      totalIecMwh:         apiData.totalIecMwh    ?? 0,
      totalPrivateMwh:     apiData.totalPrivateMwh ?? 0,
      weather: {
        temperatureC: apiData.weather?.temperatureC ?? 0,
        feelsLikeC:   apiData.weather?.feelsLikeC   ?? 0,
        humidityPct:  apiData.weather?.humidityPct  ?? 0,
      },
    });
  }, [apiData, block, onChange]);

  const applyServerData = () => {
    if (!apiData) return;
    prefillApplied.current = true;
    onChange({
      ...block,
      peakConsumptionHour: apiData.peakConsumptionHour ?? "",
      totalsMwhByFuel:     apiData.totalsMwhByFuel,
      renewableMwh:        apiData.renewableMwh,
      totalIecMwh:         apiData.totalIecMwh    ?? 0,
      totalPrivateMwh:     apiData.totalPrivateMwh ?? 0,
      weather: {
        temperatureC: apiData.weather?.temperatureC ?? 0,
        feelsLikeC:   apiData.weather?.feelsLikeC   ?? 0,
        humidityPct:  apiData.weather?.humidityPct  ?? 0,
      },
    });
  };

  const set = (next: ArchiveBlock) => onChange(next);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-200 bg-gradient-to-l from-slate-50 via-zinc-50 to-stone-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 via-zinc-400 to-stone-400 text-white shadow-sm flex-none">
          <Archive className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            {block.dayName && (
              <span className="font-semibold text-slate-800">{block.dayName}</span>
            )}
            {block.date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {fmtDate(block.date)}
              </span>
            )}
          </div>
          <div className="flex items-end gap-3">
            <div className="w-32">
              <FieldText
                label="שעת שיא"
                placeholder="14:30"
                value={block.peakConsumptionHour}
                onChange={(e) => set({ ...block, peakConsumptionHour: e.target.value })}
                startIcon={<Clock className="h-4 w-4" />}
                dir="ltr"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyServerData}
              disabled={!apiData}
              className="gap-1.5 h-9 text-xs whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              טען
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-9 w-9 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          aria-label="הסר יום"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Energy rows */}
      <ul className="divide-y divide-slate-100">
        {ENERGY_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.key} className="flex items-center gap-4 px-5 py-2.5 hover:bg-slate-50/60">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700">{row.label}</span>
              <div className="w-32">
                <FieldText
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={numStr(row.getValue(block))}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    set(row.setValue(block, Number.isFinite(v) ? v : 0));
                  }}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <span className="w-8 text-xs text-slate-500 text-right">MWh</span>
            </li>
          );
        })}
      </ul>

      {/* Weather */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-t border-slate-100 bg-slate-50/40">
        <FieldText
          label="טמפ׳ (°C)"
          type="number"
          step="0.1"
          placeholder="0"
          value={numStr(block.weather.temperatureC)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            set({ ...block, weather: { ...block.weather, temperatureC: Number.isFinite(v) ? v : 0 } });
          }}
          startIcon={<Thermometer className="h-4 w-4" />}
          dir="ltr"
        />
        <FieldText
          label="מורגשת (°C)"
          type="number"
          step="0.1"
          placeholder="0"
          value={numStr(block.weather.feelsLikeC)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            set({ ...block, weather: { ...block.weather, feelsLikeC: Number.isFinite(v) ? v : 0 } });
          }}
          startIcon={<Thermometer className="h-4 w-4" />}
          dir="ltr"
        />
        <FieldText
          label="לחות (%)"
          type="number"
          min={0}
          max={100}
          placeholder="0"
          value={numStr(block.weather.humidityPct)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            set({ ...block, weather: { ...block.weather, humidityPct: Number.isFinite(v) ? v : 0 } });
          }}
          startIcon={<Droplets className="h-4 w-4" />}
          dir="ltr"
        />
      </div>
    </div>
  );
}

// ─── Extra-day read-only card ───────────────────────────────────────────────

interface ReadOnlyExtraDayCardProps {
  block: ArchiveBlock;
}

function ReadOnlyExtraDayCard({ block }: ReadOnlyExtraDayCardProps) {
  const fmtNum = (v: number) =>
    new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(v);
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-200 bg-gradient-to-l from-slate-50 via-zinc-50 to-stone-50">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 via-zinc-400 to-stone-400 text-white shadow-sm">
          <Archive className="h-4 w-4" />
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
          {block.dayName && <span className="font-semibold text-slate-800">{block.dayName}</span>}
          {block.date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-500" />
              {fmtDate(block.date)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-500" />
            שעת שיא:&nbsp;
            <span className="font-semibold text-slate-800">{block.peakConsumptionHour || "—"}</span>
          </span>
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {ENERGY_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.key} className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium text-slate-700">{row.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-slate-800 tabular-nums">{fmtNum(row.getValue(block))}</span>
                <span className="text-xs text-slate-500">MWh</span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-t border-slate-100 bg-slate-50/40">
        <ReadOnlyWeatherStat icon={Thermometer} label="טמפרטורה"  value={block.weather.temperatureC} unit="°C" accent="text-orange-600" bg="bg-orange-50/70" ring="ring-orange-100" />
        <ReadOnlyWeatherStat icon={Thermometer} label="מורגשת"     value={block.weather.feelsLikeC}   unit="°C" accent="text-rose-600"   bg="bg-rose-50/70"   ring="ring-rose-100" />
        <ReadOnlyWeatherStat icon={Droplets}    label="לחות"       value={block.weather.humidityPct}  unit="%"  accent="text-sky-700"    bg="bg-sky-50/70"    ring="ring-sky-100" />
      </div>
    </div>
  );
}
