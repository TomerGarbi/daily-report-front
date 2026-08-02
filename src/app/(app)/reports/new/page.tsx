"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FileText,
  LayoutList,
  ArrowLeft,
  ArrowRight,
  Zap,
  Save,
  FileDown,
  Copy,
  FilePlus2,
  TrendingUp,
  Archive,
  Fuel,
  Crown,
  Briefcase,
  Database,
} from "lucide-react";
import { StepperHeader } from "@/components/StepperHeader";
import type { StepperSection } from "@/components/StepperHeader";
import {
  FuelGroupedTables,
  seedTypeFromCatalog,
  type FuelBuckets,
} from "@/components/reports/FuelGroupedTables";
import { ForecastSection } from "@/components/reports/forecast/ForecastSection";
import { ArchiveSection } from "@/components/reports/ArchiveSection";
import { FuelsSection } from "@/components/reports/FuelsSection";
// Deferred: executive summary pages pull in the full `recharts` bundle.
// Load them only when the relevant stepper steps are mounted.
const CEOSummaryPage = dynamic(
  () =>
    import("@/components/reports/ExecutiveSummarySection").then((m) => ({
      default: m.CEOSummaryPage,
    })),
  {
    ssr: false,
    loading: () => <Spinner />,
  },
);
const VPSummaryPage = dynamic(
  () =>
    import("@/components/reports/ExecutiveSummarySection").then((m) => ({
      default: m.VPSummaryPage,
    })),
  {
    ssr: false,
    loading: () => <Spinner />,
  },
);
import type { ArchiveBlock, ForecastBlock, FuelsBlock, ReportContent } from "@/types/report";
import { emptyReportContent, normalizeReportContent, emptyFuelRow } from "@/types/report";
import { emptyForecast } from "@/components/reports/forecast/forecast-defaults";
import { forecastSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { useReportMutations } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { fetchLatestReport } from "@/lib/api";
import {
  fetchPrivateSectionFromDb,
  fetchIecSectionFromDb,
  fetchForecastSectionFromDb,
  fetchArchiveSectionFromDb,
  fetchFuelsSectionFromDb,
} from "@/lib/db-section-api";
import { RefreshFromDbButton } from "@/components/reports/RefreshFromDbButton";
import { fetchStations } from "@/lib/stations-api";
import { fetchStationGroups } from "@/lib/station-groups-api";
import { fetchFuelSites } from "@/lib/fuel-sites-api";
import type { Station } from "@/types/station";
import type { StationGroup } from "@/types/stationGroup";
import type { FuelSite } from "@/types/fuelSite";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

type CreationMode = "last-report" | "scratch" | "from-db";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build one FuelRow per tank (or per declared fuel type when no tanks defined). */
function seedFuelsFromCatalog(sites: FuelSite[]): FuelsBlock {
  const rows: FuelsBlock = [];
  for (const site of sites) {
    if (site.tanks && site.tanks.length > 0) {
      for (const tank of site.tanks) {
        rows.push({
          ...emptyFuelRow(),
          stationTag:  site.tag,
          stationName: site.name,
          fuelType:    tank.fuelType,
          tankType:    tank.name,
        });
      }
    } else {
      const fuelList = site.fuelTypes && site.fuelTypes.length > 0
        ? site.fuelTypes
        : ["" as const];
      for (const f of fuelList) {
        rows.push({
          ...emptyFuelRow(),
          stationTag:  site.tag,
          stationName: site.name,
          fuelType:    f,
        });
      }
    }
  }
  return rows;
}

const SECTION_IDS = ["private", "iec", "forecast", "archive", "fuels", "ceo-summary", "vp-summary"] as const;
type SectionId = (typeof SECTION_IDS)[number];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayTitle() {
  const d = new Date();
  return `דוח יומי - ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const DAY_NAMES_HE = [
  "יום ראשון",
  "יום שני",
  "יום שלישי",
  "יום רביעי",
  "יום חמישי",
  "יום שישי",
  "שבת",
];

function getDayDescription() {
  return `דוח יומי ל${DAY_NAMES_HE[new Date().getDay()]}`;
}

// ─── Mode card ──────────────────────────────────────────────────────────────

function ModeCard({
  icon: Icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-orange-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:shadow-sm"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-center">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NewReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createReport, createReportFromDb } = useReportMutations();

  const [mode, setMode] = useState<CreationMode | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [groups, setGroups] = useState<StationGroup[]>([]);
  const [fuelSites, setFuelSites] = useState<FuelSite[]>([]);

  const [title, setTitle] = useState(getTodayTitle());
  const [subtitle, setSubtitle] = useState(getDayDescription());
  const [activeSection, setActiveSection] = useState<SectionId>("private");
  const [content, setContent] = useState<ReportContent>(emptyReportContent());
  const [isSaving, setIsSaving] = useState(false);

  // ── Per-section setters ───────────────────────────────────────────────
  const setPrivateBuckets = useCallback(
    (next: FuelBuckets) =>
      setContent((c) => ({ ...c, private: next })),
    [],
  );
  const setIecBuckets = useCallback(
    (next: FuelBuckets) =>
      setContent((c) => ({ ...c, iec: next })),
    [],
  );
  const setForecast = useCallback(
    (next: ForecastBlock) =>
      setContent((c) => ({ ...c, forecast: next })),
    [],
  );
  const setArchive = useCallback(
    (next: ArchiveBlock) =>
      setContent((c) => ({ ...c, archive: next })),
    [],
  );
  const setArchiveExtraDays = useCallback(
    (next: ArchiveBlock[]) =>
      setContent((c) => ({ ...c, archiveExtraDays: next })),
    [],
  );
  const setFuels = useCallback(
    (next: FuelsBlock) =>
      setContent((c) => ({ ...c, fuels: next })),
    [],
  );

  // Per-step validation errors (currently only the forecast step uses Zod-driven
  // field-level errors). Cleared whenever the user navigates between steps.
  const [forecastErrors, setForecastErrors] = useState<Record<string, string>>({});

  const handleNextFromForecast = useCallback(() => {
    const candidate = content.forecast ?? emptyForecast();
    const result = forecastSchema.safeParse(candidate);
    if (!result.success) {
      const flat: Record<string, string> = {};
      for (const issue of result.error.issues) {
        flat[issue.path.join(".")] = issue.message;
      }
      setForecastErrors(flat);
      toast.error("יש להשלים את כל שדות התחזית לפני המעבר הלאה");
      return;
    }
    setForecastErrors({});
    setContent((c) => ({ ...c, forecast: result.data }));
    setActiveSection("archive");
  }, [content.forecast]);

  // ── Load fuel-site catalog once on mount ──────────────────────────────
  // Decoupled from mode selection so a failure in fetchStations / fetchLatestReport
  // doesn't discard a successful fuel-sites fetch (which would leave the
  // "Add site" dropdown empty in the fuels section).
  useEffect(() => {
    let cancelled = false;
    fetchFuelSites()
      .then((s) => {
        if (!cancelled) {
          setFuelSites(s);
          // Pre-populate fuel rows from catalog; preserve rows from a loaded report.
          setContent((c) => ({
            ...c,
            fuels: c.fuels && c.fuels.length > 0 ? c.fuels : seedFuelsFromCatalog(s),
          }));
        }
      })
      .catch((err) => {
        console.error("[NewReport] fetchFuelSites failed:", err);
        toast.error("שגיאה בטעינת קטלוג אתרי הדלק");
      });
    return () => { cancelled = true; };
  }, []);

  // ── Mode selection ────────────────────────────────────────────────────
  const handleModeSelect = useCallback(
    async (selected: CreationMode) => {
      setIsLoadingData(true);
      try {
        if (selected === "scratch") {
          // Pre-populate from the station catalog: private → private bucket,
          // iec → iec bucket. Each station's group decides which sub-table
          // it lands in. Defaults: status=Active, installedCapacity from
          // catalog, all other capacities 0.
          const [fetched, fetchedGroups] = await Promise.all([
            fetchStations(),
            fetchStationGroups(),
          ]);
          setStations(fetched);
          setGroups(fetchedGroups);
          setContent((prev) => ({
            private: seedTypeFromCatalog(fetched, "private", fetchedGroups),
            iec:     seedTypeFromCatalog(fetched, "iec",     fetchedGroups),
            fuels:   prev.fuels,  // preserve fuel rows seeded from catalog
          }));
        } else if (selected === "last-report") {
          const [report, fetched, fetchedGroups] = await Promise.all([
            fetchLatestReport(),
            fetchStations(),
            fetchStationGroups(),
          ]);
          setStations(fetched);
          setGroups(fetchedGroups);
          if (report?.content) {
            const normalized = normalizeReportContent(report.content);
            setContent((prev) => ({
              ...normalized,
              // Use report's fuel rows if present; otherwise keep catalog-seeded rows
              fuels: normalized.fuels && normalized.fuels.length > 0
                ? normalized.fuels
                : prev.fuels,
            }));
          } else {
            toast.error("לא נמצא דוח קודם — נפתח דוח ריק");
            setContent((prev) => ({ ...emptyReportContent(), fuels: prev.fuels }));
          }
        }
        setMode(selected);
      } catch (err) {
        console.error("[NewReport] mode select failed:", err);
        toast.error("שגיאה בטעינת הנתונים — נפתח דוח ריק");
        setContent((prev) => ({ ...emptyReportContent(), fuels: prev.fuels }));
        setMode(selected);
      } finally {
        setIsLoadingData(false);
      }
    },
    [],
  );

  // ── Per-section DB refresh handlers ────────────────────────────────────
  const handleRefreshPrivateFromDb = useCallback(async () => {
    const data = await fetchPrivateSectionFromDb();
    setPrivateBuckets(data);
  }, [setPrivateBuckets]);

  const handleRefreshIecFromDb = useCallback(async () => {
    const data = await fetchIecSectionFromDb();
    setIecBuckets(data);
  }, [setIecBuckets]);

  const handleRefreshForecastFromDb = useCallback(async () => {
    const data = await fetchForecastSectionFromDb();
    setForecast(data);
  }, [setForecast]);

  const handleRefreshArchiveFromDb = useCallback(async () => {
    const result = await fetchArchiveSectionFromDb();
    setArchive(result.archive);
    if (result.lastYearArchive) {
      setContent((c) => ({ ...c, lastYearArchive: result.lastYearArchive }));
    }
  }, [setArchive]);

  const handleRefreshFuelsFromDb = useCallback(async () => {
    const data = await fetchFuelsSectionFromDb();
    setFuels(data);
  }, [setFuels]);

  // ── From-DB: direct server-side creation ─────────────────────────────
  // Calls POST /reports/from-db, which fetches and assembles content in the
  // API layer. On success the user is sent to the new report to review/edit.
  const handleCreateFromDb = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const report = await createReportFromDb({
        title,
        description: subtitle,
        status: "draft",
      });
      toast.success("הדוח נוצר בהצלחה מנתוני מסד הנתונים");
      router.push(`/reports/${report.id}`);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr.message ?? "שגיאה בטעינת נתונים ממסד הנתונים");
    } finally {
      setIsLoadingData(false);
    }
  }, [title, subtitle, createReportFromDb, router]);

  // ── Warn on refresh / tab close (only after mode chosen) ──────────────
  useEffect(() => {
    if (!mode) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [mode]);

  // ── Save (draft / published) ──────────────────────────────────────────
  const handleSave = useCallback(
    async (status: "draft" | "published") => {
      setIsSaving(true);
      try {
        const payload = {
          title,
          description: subtitle,
          status,
          content,
        };
        await createReport(payload);
        toast.success(
          status === "draft" ? "הדוח נשמר כטיוטה" : "הדוח נשמר בהצלחה",
        );
        router.push("/reports");
      } catch (err: unknown) {
        console.error("[SaveReport] error:", err);
        const apiErr = err as {
          message?: string;
          status?: number;
          body?: Record<string, unknown>;
        };
        const errors = apiErr.body?.errors;
        if (Array.isArray(errors)) {
          const details = errors
            .map(
              (e: { field?: string; message?: string }) =>
                `${e.field ?? "?"}: ${e.message ?? "שגיאה"}`,
            )
            .join("\n");
          toast.error(`שגיאת ולידציה:\n${details}`);
        } else if (typeof errors === "object" && errors !== null) {
          const details = Object.entries(errors as Record<string, string>)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join("\n");
          toast.error(`שגיאת ולידציה:\n${details}`);
        } else {
          toast.error(apiErr.message ?? "שגיאה בשמירת הדוח");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [title, subtitle, content, createReport, router],
  );

  // ── Mode selection screen ─────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm">
          <div className="mx-auto max-w-3xl flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">יצירת דוח חדש</h1>
              <p className="text-sm text-slate-500">בחר כיצד להתחיל את הדוח</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/reports")}
              className="gap-1.5 mr-auto"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה לדוחות
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-12">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Spinner size="lg" label="טוען נתונים…" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ModeCard
                icon={Copy}
                title="המשך מדוח אחרון"
                description="צור דוח חדש עם הנתונים מהדוח האחרון שהוגש"
                onClick={() => handleModeSelect("last-report")}
                disabled={isLoadingData}
              />
              <ModeCard
                icon={FilePlus2}
                title="דוח ריק מהקטלוג"
                description="התחל דוח חדש עם תחנות מקטלוג ההגדרות (סטטוס: פעיל)"
                onClick={() => handleModeSelect("scratch")}
                disabled={isLoadingData}
              />
              <ModeCard
                icon={Database}
                title="טען נתונים ממסד הנתונים"
                description="צור דוח אוטומטית מנתוני מערכת SQL — הנתונים יועמסו ישירות מהמסד"
                onClick={handleCreateFromDb}
                disabled={isLoadingData}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Stepper form ──────────────────────────────────────────────────────
  const sections: StepperSection[] = [
    { id: "private",     label: "יחידות פרטיות",  icon: LayoutList },
    { id: "iec",         label: "חברת חשמל",      icon: Zap },
    { id: "forecast",    label: "תחזית",          icon: TrendingUp },
    { id: "archive",     label: "ארכיון",          icon: Archive },
    { id: "fuels",       label: "דלקים",          icon: Fuel },
    { id: "ceo-summary", label: "דוח מנכז″ל",     icon: Crown },
    { id: "vp-summary",  label: "דוח סמנכז″ל",    icon: Briefcase },
  ];

  return (
      <div className="min-h-screen bg-slate-100 text-[17px]" dir="rtl">
      <StepperHeader
        icon={FileText}
        title={title}
        onTitleChange={setTitle}
        subtitle={subtitle}
        onSubtitleChange={setSubtitle}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={(id) => setActiveSection(id as SectionId)}
        backLabel="חזרה לדוחות"
        onBack={() => router.push("/reports")}
      />

      <div className={`mx-auto ${activeSection === "private" || activeSection === "iec" ? "" : activeSection === "forecast" ? "max-w-7xl" : "max-w-5xl"} px-6 py-8`}>
        {activeSection === "private" && (
          <div className="space-y-8">
            <FuelGroupedTables
              buckets={content.private}
              groups={groups}
              type="private"
              onChange={setPrivateBuckets}
              titlePrefix="יחידות פרטיות"
            />

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור כטיוטה"}</span>
                </Button>
                <RefreshFromDbButton onRefresh={handleRefreshPrivateFromDb} disabled={isSaving} />
              </div>
              <div className="flex gap-3">
                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, content })}
                    className="gap-2 text-base px-8"
                  >
                    <span>הדפס נתונים לקונסול</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={() => setActiveSection("iec")}
                  className="gap-2 text-base px-8"
                >
                  <span>חברת חשמל</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "iec" && (
          <div className="space-y-8">
            <FuelGroupedTables
              buckets={content.iec}
              groups={groups}
              type="iec"
              onChange={setIecBuckets}
              titlePrefix="חברת חשמל"
            />

            <div className="flex justify-between">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveSection("private")}
                className="gap-2 text-base px-8"
              >
                <ArrowRight className="h-5 w-5" />
                <span>חזרה ליחידות פרטיות</span>
              </Button>
              <div className="flex items-center gap-3">
                <RefreshFromDbButton onRefresh={handleRefreshIecFromDb} disabled={isSaving} />
                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, content })}
                    className="gap-2 text-base px-8"
                  >
                    <span>הדפס נתונים לקונסול</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => setActiveSection("forecast")}
                  className="gap-2 text-base px-8"
                >
                  <span>תחזית</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "forecast" && (
          <div className="space-y-8">
            <ForecastSection
              value={content.forecast}
              onChange={setForecast}
              errors={forecastErrors}
            />

            <div className="flex justify-between">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveSection("iec")}
                className="gap-2 text-base px-8"
              >
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לחברת חשמל</span>
              </Button>
              <div className="flex items-center gap-3">
                <RefreshFromDbButton onRefresh={handleRefreshForecastFromDb} disabled={isSaving} />
                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, content })}
                    className="gap-2 text-base px-8"
                  >
                    <span>הדפס נתונים לקונסול</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={handleNextFromForecast}
                  className="gap-2 text-base px-8"
                >
                  <span>ארכיון</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "archive" && (
          <div className="space-y-8">
            <ArchiveSection
              value={content.archive}
              onChange={setArchive}
              extraDays={content.archiveExtraDays}
              onExtraDaysChange={setArchiveExtraDays}
              lastYearValue={content.lastYearArchive}
              enabled
            />

            <div className="flex justify-between">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveSection("forecast")}
                className="gap-2 text-base px-8"
              >
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לתחזית</span>
              </Button>
              <div className="flex items-center gap-3">
                <RefreshFromDbButton onRefresh={handleRefreshArchiveFromDb} disabled={isSaving} />
                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, content })}
                    className="gap-2 text-base px-8"
                  >
                    <span>הדפס נתונים לקונסול</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => setActiveSection("fuels")}
                  className="gap-2 text-base px-8"
                >
                  <span>דלקים</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "fuels" && (
          <div className="space-y-8">
            <FuelsSection
              value={content.fuels ?? []}
              onChange={setFuels}
              sites={fuelSites}
            />

            <div className="flex justify-between">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveSection("archive")}
                className="gap-2 text-base px-8"
              >
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לארכיון</span>
              </Button>
              <div className="flex items-center gap-3">
                <RefreshFromDbButton onRefresh={handleRefreshFuelsFromDb} disabled={isSaving} />
                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, content })}
                    className="gap-2 text-base px-8"
                  >
                    <span>הדפס נתונים לקונסול</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => setActiveSection("ceo-summary")}
                  className="gap-2 text-base px-8"
                >
                  <span>דוח מנכ״ל</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "ceo-summary" && (
          <div className="space-y-8">
            <CEOSummaryPage
              content={content}
              title={title}
              subtitle={subtitle}
              date={new Date().toLocaleDateString("he-IL")}
            />

            <div className="flex justify-between">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveSection("fuels")}
                className="gap-2 text-base px-8"
                disabled={isSaving}
              >
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לדלקים</span>
              </Button>
              <div className="flex gap-3">
                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, content })}
                    className="gap-2 text-base px-8"
                  >
                    <span>הדפס נתונים לקונסול</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => setActiveSection("vp-summary")}
                  className="gap-2 text-base px-8"
                >
                  <span>דוח סמנכז″ל</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "vp-summary" && (
          <div className="space-y-8">
            <VPSummaryPage
              content={content}
              title={title}
              subtitle={subtitle}
              date={new Date().toLocaleDateString("he-IL")}
            />

            <div className="flex justify-between">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveSection("ceo-summary")}
                className="gap-2 text-base px-8"
                disabled={isSaving}
              >
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לדוח מנכז″ל</span>
              </Button>
              <div className="flex gap-3">
                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, content })}
                    className="gap-2 text-base px-8"
                  >
                    <span>הדפס נתונים לקונסול</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleSave("published")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <Save className="h-5 w-5" />
                  <span>{isSaving ? "שומר..." : "שמור ופרסם"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
