"use client";

import {
  Crown,
  Briefcase,
  CloudSun,
  Zap,
  Wrench,
  AlertTriangle,
  Ban,
  Factory,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";
import type { ReportContent, ForecastBlock, StationRow } from "@/types/report";
import {
  STATION_FUELS,
  STATION_FUEL_LABELS,
  type StationFuel,
} from "@/types/station";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExecSummaryProps {
  content: ReportContent;
  title: string;
  subtitle?: string;
  date?: string;
  /** Recipient name for the VP memo header. Defaults to "מנכ״ל". */
  ceoName?: string;
  /** "Data updated to" timestamp shown in the header.
   *  Defaults to forecast.weather.fetchedAt, then to now. */
  updatedAt?: string;
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

const PLACEHOLDER = "—";

function fmtNum(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  return `${n.toLocaleString("he-IL")}${suffix ? " " + suffix : ""}`;
}

function fmtHour(s: string | undefined): string {
  return s && s.length > 0 ? s : PLACEHOLDER;
}

function fmtTimeHHMM(input?: string | Date): string {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return PLACEHOLDER;
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateTime(input?: string): string {
  if (!input) return PLACEHOLDER;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Memo sub-components ─────────────────────────────────────────────────────

function MemoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="min-w-[6.5rem] shrink-0 text-sm font-semibold text-slate-500">
        {label}:
      </span>
      <span className="text-sm text-slate-900">{children}</span>
    </div>
  );
}

function SectionCard({
  number,
  title,
  icon: Icon,
  children,
  accentClass = "bg-blue-50 text-blue-700 ring-blue-200",
}: {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  accentClass?: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${accentClass}`}
        >
          {number}
        </span>
        <Icon className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function DataRow({
  label,
  value,
  hint,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  sub?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        sub ? "mr-3 border-r-2 border-slate-200 pr-4 text-xs" : "py-1.5"
      }`}
    >
      <div className="min-w-0 flex-1">
        <span className={sub ? "text-slate-500" : "text-sm text-slate-700"}>
          {label}
        </span>
        {hint && (
          <span className="ms-2 text-xs text-slate-400">({hint})</span>
        )}
      </div>
      <span
        className={`shrink-0 font-semibold tabular-nums ${
          sub ? "text-slate-600" : "text-sm text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm italic text-slate-400">{text}</p>;
}

// ─── Fuel palette ───────────────────────────────────────────────────────────

const FUEL_COLORS: Record<StationFuel, string> = {
  gas:      "#f97316",
  diesel:   "#a855f7",
  solar:    "#facc15",
  turbine:  "#14b8a6",
  coal:     "#64748b",
  hydro:    "#06b6d4",
  wind:     "#10b981",
  nuclear:  "#ef4444",
  mazut:    "#92400e",
  methanol: "#0ea5e9",
  other:    "#94a3b8",
};

// ─── Aggregation helpers ────────────────────────────────────────────────────

type Ownership = "private" | "iec";

function emptyFuelRecord(): Record<StationFuel, number> {
  return STATION_FUELS.reduce(
    (acc, f) => ({ ...acc, [f]: 0 }),
    {} as Record<StationFuel, number>,
  );
}

function aggregatePeakByFuel(
  content: ReportContent,
  filter?: Ownership,
): Record<StationFuel, number> {
  const result = emptyFuelRecord();
  const ownerships: Ownership[] = filter ? [filter] : ["private", "iec"];
  for (const ow of ownerships) {
    const block = content[ow];
    for (const fuel of STATION_FUELS) {
      const stationData = block[fuel];
      if (!stationData) continue;
      for (const rows of Object.values(stationData)) {
        for (const row of rows) {
          result[fuel] += row.peakCapacity || 0;
        }
      }
    }
  }
  return result;
}

function aggregateReserveByFuel(
  content: ReportContent,
  filter?: Ownership,
): Record<StationFuel, number> {
  const result = emptyFuelRecord();
  const ownerships: Ownership[] = filter ? [filter] : ["private", "iec"];
  for (const ow of ownerships) {
    const block = content[ow];
    for (const fuel of STATION_FUELS) {
      const stationData = block[fuel];
      if (!stationData) continue;
      for (const rows of Object.values(stationData)) {
        for (const row of rows) {
          const reserve =
            (row.availableCapacity || 0) - (row.peakCapacity || 0);
          if (reserve > 0) result[fuel] += reserve;
        }
      }
    }
  }
  return result;
}

const sumValues = (r: Record<string, number>) =>
  Object.values(r).reduce((a, b) => a + b, 0);

interface FuelDatum {
  fuel: StationFuel;
  label: string;
  value: number;
  color: string;
}

interface StationStatusJob {
  ownership: Ownership;
  fuel: StationFuel;
  stationName: string;
  row: StationRow;
}

function toChartData(record: Record<StationFuel, number>): FuelDatum[] {
  return STATION_FUELS.map((f) => ({
    fuel: f,
    label: STATION_FUEL_LABELS[f],
    value: record[f],
    color: FUEL_COLORS[f],
  })).filter((d) => d.value > 0);
}

function collectStationStatusJobs(
  content: ReportContent,
  status: StationRow["status"],
): StationStatusJob[] {
  const jobs: StationStatusJob[] = [];
  const ownerships: Ownership[] = ["private", "iec"];

  for (const ownership of ownerships) {
    const block = content[ownership];
    for (const fuel of STATION_FUELS) {
      const stationData = block[fuel];
      if (!stationData) continue;
      for (const [stationName, rows] of Object.entries(stationData)) {
        for (const row of rows) {
          if (row.status === status) {
            jobs.push({ ownership, fuel, stationName, row });
          }
        }
      }
    }
  }

  return jobs.sort((a, b) => {
    const aTime = a.row.startTime ? new Date(a.row.startTime).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.row.startTime ? new Date(b.row.startTime).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

function StationStatusJobsList({
  jobs,
  emptyText,
  badgeText,
  cardClassName,
  badgeClassName,
}: {
  jobs: StationStatusJob[];
  emptyText: string;
  badgeText: string;
  cardClassName: string;
  badgeClassName: string;
}) {
  if (jobs.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  const ownershipLabel: Record<Ownership, string> = {
    private: "יחידות פרטיות",
    iec:     "חברת חשמל",
  };

  return (
    <div className="space-y-3">
      {jobs.map(({ ownership, fuel, stationName, row }, idx) => (
        <div
          key={`${ownership}-${fuel}-${stationName}-${row.stationNumber}-${idx}`}
          className={`rounded-lg border px-4 py-3 ${cardClassName}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {row.stationName ?? stationName} — יחידה {row.stationNumber}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {ownershipLabel[ownership]} · {STATION_FUEL_LABELS[fuel]}
              </p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClassName}`}>
              {badgeText}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-3">
            <span>
              <span className="font-semibold text-slate-700">התחלה: </span>
              {fmtDateTime(row.startTime)}
            </span>
            <span>
              <span className="font-semibold text-slate-700">סיום: </span>
              {fmtDateTime(row.endTime)}
            </span>
            <span>
              <span className="font-semibold text-slate-700">סיום מעודכן: </span>
              {fmtDateTime(row.updatedEndTime)}
            </span>
          </div>

          {row.notes && (
            <p className="mt-2 rounded-md bg-white/70 px-3 py-2 text-xs leading-5 text-slate-600">
              {row.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Shared memo metadata strip ─────────────────────────────────────────────

function MemoMetadata({
  ceoName,
  displayDate,
  updated,
}: {
  ceoName: string;
  displayDate: string;
  updated: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/60 px-8 py-5">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <MemoField label="אל">{ceoName}</MemoField>
        <MemoField label="תאריך">{displayDate}</MemoField>
        <MemoField label="נושא">
          נתוני שוק החשמל ליום {displayDate}
        </MemoField>
        <MemoField label="עודכן בשעה">{updated}</MemoField>
      </div>
    </div>
  );
}

// ─── Shared weather section card ────────────────────────────────────────────

function WeatherSectionCard({
  number = 1,
  forecast,
}: {
  number?: number;
  forecast?: ForecastBlock;
}) {
  const today = forecast?.weather.today;
  const region = forecast?.weather.region;
  return (
    <SectionCard
      number={number}
      title={`תחזית מזג אוויר${region ? ` — ${region}` : ""}`}
      icon={CloudSun}
      accentClass="bg-sky-50 text-sky-700 ring-sky-200"
    >
      <div className="divide-y divide-slate-100">
        <DataRow label="תיאור" value={PLACEHOLDER} />
        <DataRow
          label="טווח טמפרטורות"
          value={today ? fmtNum(today.temperatureC, "°C") : PLACEHOLDER}
          hint="מקסימום / מינימום"
        />
        <DataRow
          label="טמפרטורה מורגשת"
          value={fmtNum(today?.feelsLikeC, "°C")}
        />
        <DataRow label="לחות" value={fmtNum(today?.humidityPct, "%")} />
      </div>
    </SectionCard>
  );
}

// ─── Fuel mini grid (used by CEO summary rows) ──────────────────────────────

function FuelMiniGrid({ record }: { record: Record<StationFuel, number> }) {
  const items = toChartData(record);
  if (items.length === 0) {
    return <p className="text-xs italic text-slate-400">אין נתונים זמינים.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.fuel}
          className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: it.color }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-600">
              {it.label}
            </p>
            <p className="text-sm font-semibold tabular-nums text-slate-900">
              {fmtNum(it.value, "MW")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page divider ────────────────────────────────────────────────────────────

function ExecPageDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2" dir="rtl">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 shadow-sm">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

// ─── VP Page ─────────────────────────────────────────────────────────────────
// Memo-style daily electricity market briefing addressed to the CEO.
// Exported individually so it can be split into its own stepper step later
// without touching this file.

export function VPSummaryPage({
  content,
  date,
  ceoName = "מנכ״ל",
  updatedAt,
}: ExecSummaryProps) {
  const forecast: ForecastBlock | undefined = content.forecast;
  const todayLoad = forecast?.load.today;
  const maintenanceJobs = collectStationStatusJobs(content, "Maintenance");
  const inactiveJobs = collectStationStatusJobs(content, "Inactive");

  const updated = fmtTimeHHMM(updatedAt ?? forecast?.weather.fetchedAt);
  const displayDate = date ?? new Date().toLocaleDateString("he-IL");

  return (
    <article
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      dir="rtl"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-l from-blue-700 to-blue-900 px-8 py-6 text-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-blue-300/60 via-blue-200/40 to-blue-300/60" />
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              דוח סגן נשיא
            </p>
            <h2 className="text-lg font-bold leading-tight">
              סקירת שוק החשמל היומית
            </h2>
          </div>
        </div>
      </div>

      {/* Memo metadata */}
      <MemoMetadata
        ceoName={ceoName}
        displayDate={displayDate}
        updated={updated}
      />

      {/* Body */}
      <div className="space-y-5 px-8 py-6">
        {/* 1. Weather */}
        <WeatherSectionCard number={1} forecast={forecast} />

        {/* 2. Electricity data */}
        <SectionCard
          number={2}
          title="נתוני חשמל"
          icon={Zap}
          accentClass="bg-amber-50 text-amber-700 ring-amber-200"
        >
          <div className="divide-y divide-slate-100">
            <DataRow label="שעת שיא" value={fmtHour(todayLoad?.peakHour)} />
            <DataRow
              label="תחזית שיא"
              value={fmtNum(todayLoad?.value, "MW")}
            />
            <DataRow label="ייצור בשעת השיא" value={PLACEHOLDER} />
            <div className="space-y-1 py-1.5">
              <DataRow label="עתודה בשיא" value={PLACEHOLDER} />
              <DataRow label="עתודת קיטור" value={PLACEHOLDER} sub />
            </div>
          </div>
        </SectionCard>

        {/* 3. Scheduled maintenance */}
        <SectionCard
          number={3}
          title="תחזוקה מתוכננת"
          icon={Wrench}
          accentClass="bg-emerald-50 text-emerald-700 ring-emerald-200"
        >
          <StationStatusJobsList
            jobs={maintenanceJobs}
            emptyText="לא דווחו עבודות תחזוקה מתוכננות."
            badgeText="תחזוקה"
            cardClassName="border-yellow-200 bg-yellow-50"
            badgeClassName="border-amber-200 bg-amber-50 text-amber-700"
          />
        </SectionCard>

        {/* 4. Malfunctions */}
        <SectionCard
          number={4}
          title="תקלות"
          icon={AlertTriangle}
          accentClass="bg-rose-50 text-rose-700 ring-rose-200"
        >
          <StationStatusJobsList
            jobs={inactiveJobs}
            emptyText="לא דווחו תחנות לא פעילות או תקלות."
            badgeText="תקלה / לא פעיל"
            cardClassName="border-red-200 bg-red-50"
            badgeClassName="border-red-200 bg-red-100 text-red-700"
          />
        </SectionCard>

        {/* 5. Total limitations */}
        <SectionCard
          number={5}
          title="סך הגבלות"
          icon={Ban}
          accentClass="bg-slate-100 text-slate-700 ring-slate-300"
        >
          <DataRow label="הגבלות פעילות (MW)" value={PLACEHOLDER} />
        </SectionCard>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-8 py-3 text-center text-xs text-slate-400">
        מסמך פנימי — לשימוש ההנהלה בלבד
      </div>
    </article>
  );
}

// ─── CEO Page ────────────────────────────────────────────────────────────────
// Exported individually so it can be split into its own stepper step later.

export function CEOSummaryPage({
  content,
  date,
  ceoName = "מנכ״ל",
  updatedAt,
}: ExecSummaryProps) {
  const forecast: ForecastBlock | undefined = content.forecast;
  const updated = fmtTimeHHMM(updatedAt ?? forecast?.weather.fetchedAt);
  const displayDate = date ?? new Date().toLocaleDateString("he-IL");

  // ── Aggregations ──
  const peakAll = aggregatePeakByFuel(content);
  const peakIEC = aggregatePeakByFuel(content, "iec");
  const peakPrv = aggregatePeakByFuel(content, "private");
  const resAll = aggregateReserveByFuel(content);
  const totalPeakAll = sumValues(peakAll);
  const totalReserveAll = sumValues(resAll);
  const totalPeakIEC = sumValues(peakIEC);
  const totalPeakPrv = sumValues(peakPrv);
  const peakConsumption = forecast?.load.today.value;
  const peakHour = fmtHour(forecast?.load.today.peakHour);

  const reservePct =
    totalPeakAll > 0 ? Math.round((totalReserveAll / totalPeakAll) * 100) : 0;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      dir="rtl"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-l from-slate-800 to-slate-950 px-8 py-6 text-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-amber-400 via-amber-300 to-amber-400" />
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              דוח מנכ״ל
            </p>
            <h2 className="text-lg font-bold leading-tight">
              סקירת שוק החשמל היומית
            </h2>
          </div>
        </div>
      </div>

      {/* Memo metadata */}
      <MemoMetadata
        ceoName={ceoName}
        displayDate={displayDate}
        updated={updated}
      />

      {/* Body */}
      <div className="space-y-5 px-8 py-6">
        {/* 1. Weather */}
        <WeatherSectionCard number={1} forecast={forecast} />

        {/* 2. National manufacturing */}
        <SectionCard
          number={2}
          title="ייצור ארצי"
          icon={Factory}
          accentClass="bg-amber-50 text-amber-700 ring-amber-200"
        >
          <div className="divide-y divide-slate-100">
            <DataRow
              label="צריכה בשעת השיא (תחזית)"
              value={fmtNum(peakConsumption, " MW")}
              hint={peakHour !== PLACEHOLDER ? peakHour : undefined}
            />
            <DataRow
              label="יכולת ייצור לשעת השיא"
              value={fmtNum(totalPeakAll, " MW")}
            />
            <div className="pt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                ייצור לפי סוג דלק
              </h4>
              <FuelMiniGrid record={peakAll} />
            </div>
          </div>
        </SectionCard>

        {/* 3. National reserve */}
        <SectionCard
          number={3}
          title="עתודה ארצית"
          icon={ShieldCheck}
          accentClass="bg-emerald-50 text-emerald-700 ring-emerald-200"
        >
          <div className="divide-y divide-slate-100">
            <DataRow
              label="עתודה לשעת השיא"
              value={fmtNum(totalReserveAll, " MW")}
              hint={
                totalPeakAll > 0 ? `${reservePct}% מהכושר` : undefined
              }
            />
            <div className="py-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                עתודה לפי סוג דלק
              </h4>
              <FuelMiniGrid record={resAll} />
            </div>
            <div className="flex items-center gap-2 pt-3">
              <input
                type="checkbox"
                id="agreements-activation"
                disabled
                checked={false}
                readOnly
                className="h-4 w-4 cursor-not-allowed rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="agreements-activation"
                className="text-xs text-slate-600"
              >
                הפעלת הסכמים
              </label>
            </div>
          </div>
        </SectionCard>

        {/* 4. IEC only */}
        <SectionCard
          number={4}
          title="ייצור — חברת חשמל בלבד"
          icon={Building2}
          accentClass="bg-blue-50 text-blue-700 ring-blue-200"
        >
          <div className="divide-y divide-slate-100">
            <DataRow
              label="סך יכולת ייצור"
              value={fmtNum(totalPeakIEC, " MW")}
            />
            <div className="pt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                לפי סוג דלק
              </h4>
              <FuelMiniGrid record={peakIEC} />
            </div>
          </div>
        </SectionCard>

        {/* 5. Private only */}
        <SectionCard
          number={5}
          title="ייצור — יחידות פרטיות בלבד"
          icon={Users}
          accentClass="bg-purple-50 text-purple-700 ring-purple-200"
        >
          <div className="divide-y divide-slate-100">
            <DataRow
              label="סך יכולת ייצור"
              value={fmtNum(totalPeakPrv, " MW")}
            />
            <div className="pt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                לפי סוג דלק
              </h4>
              <FuelMiniGrid record={peakPrv} />
            </div>
          </div>
        </SectionCard>


      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-8 py-3 text-center text-xs text-slate-400">
        מסמך פנימי — לשימוש ההנהלה בלבד
      </div>
    </article>
  );
}

// ─── Combined section ────────────────────────────────────────────────────────

export function ExecutiveSummarySection(props: ExecSummaryProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <VPSummaryPage {...props} />
      <ExecPageDivider label="דף מנכ״ל" />
      <CEOSummaryPage {...props} />
    </div>
  );
}
