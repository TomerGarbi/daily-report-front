"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  LayoutList,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Zap,
  Save,
  FileDown,
  TrendingUp,
  Archive,
  Fuel,
} from "lucide-react";
import { StepperHeader } from "@/components/StepperHeader";
import type { StepperSection } from "@/components/StepperHeader";
import {
  FuelGroupedTables,
  type FuelBuckets,
} from "@/components/reports/FuelGroupedTables";
import { ForecastSection } from "@/components/reports/forecast/ForecastSection";
import { ArchiveSection } from "@/components/reports/ArchiveSection";
import { FuelsSection } from "@/components/reports/FuelsSection";
import { RefreshFromDbButton } from "@/components/reports/RefreshFromDbButton";
import {
  fetchPrivateSectionFromDb,
  fetchIecSectionFromDb,
  fetchForecastSectionFromDb,
  fetchArchiveSectionFromDb,
  fetchFuelsSectionFromDb,
} from "@/lib/db-section-api";
import type { ArchiveBlock, ForecastBlock, FuelsBlock, ReportContent } from "@/types/report";
import { emptyReportContent, normalizeReportContent } from "@/types/report";
import { emptyForecast } from "@/components/reports/forecast/forecast-defaults";
import { forecastSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { useReport, useReportMutations } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { fetchFuelSites } from "@/lib/fuel-sites-api";
import { fetchStationGroups } from "@/lib/station-groups-api";
import type { FuelSite } from "@/types/fuelSite";
import type { StationGroup } from "@/types/stationGroup";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

// ─── Section definitions ────────────────────────────────────────────────────

const SECTION_IDS = ["private", "iec", "forecast", "archive", "fuels", "review"] as const;
type SectionId = (typeof SECTION_IDS)[number];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { report, isLoading: reportLoading, error: reportError } = useReport(id);
  const { updateReport } = useReportMutations();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [activeSection, setActiveSection] = useState<SectionId>("private");
  const [content, setContent] = useState<ReportContent>(emptyReportContent());
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [fuelSites, setFuelSites] = useState<FuelSite[]>([]);
  const [groups, setGroups] = useState<StationGroup[]>([]);

  // ── Per-section setters ───────────────────────────────────────────────
  const setPrivateBuckets = useCallback(
    (next: FuelBuckets) => setContent((c) => ({ ...c, private: next })),
    [],
  );
  const setIecBuckets = useCallback(
    (next: FuelBuckets) => setContent((c) => ({ ...c, iec: next })),
    [],
  );
  const setForecast = useCallback(
    (next: ForecastBlock) => setContent((c) => ({ ...c, forecast: next })),
    [],
  );
  const setArchive = useCallback(
    (next: ArchiveBlock) => setContent((c) => ({ ...c, archive: next })),
    [],
  );
  const setArchiveExtraDays = useCallback(
    (next: ArchiveBlock[]) => setContent((c) => ({ ...c, archiveExtraDays: next })),
    [],
  );
  const setFuels = useCallback(
    (next: FuelsBlock) => setContent((c) => ({ ...c, fuels: next })),
    [],
  );

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

  // ── Hydrate state from fetched report ─────────────────────────────────
  useEffect(() => {
    if (report && !initialized) {
      setTitle(report.title);
      setSubtitle(report.description);
      setContent(normalizeReportContent(report.content));
      setInitialized(true);
    }
  }, [report, initialized]);
  // ── Load fuel-site catalog once ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchFuelSites()
      .then((s) => { if (!cancelled) setFuelSites(s); })
      .catch((err) => console.error("[EditReport] fetchFuelSites failed:", err));    fetchStationGroups()
      .then((g) => { if (!cancelled) setGroups(g); })
      .catch((err) => console.error("[EditReport] fetchStationGroups failed:", err));    return () => { cancelled = true; };
  }, []);
  // ── Warn on refresh / tab close ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

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
        await updateReport(id, payload);
        toast.success(
          status === "draft"
            ? "השינויים עודכנו כטיוטה"
            : "השינויים עודכנו ופורסמו",
        );
        router.push("/reports");
      } catch (err: unknown) {
        console.error("[EditReport] error:", err);
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
          toast.error(apiErr.message ?? "שגיאה בעדכון הדוח");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [id, title, subtitle, content, updateReport, router],
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

  // ── Loading / error states ────────────────────────────────────────────
  if (reportLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="טוען דוח לעריכה…" />
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
        <p className="text-red-600 text-lg">
          {reportError?.message ?? "הדוח לא נמצא"}
        </p>
        <Button variant="outline" onClick={() => router.push("/reports")}>
          חזרה לדוחות
        </Button>
      </div>
    );
  }

  // ── Authorization ─────────────────────────────────────────────────────
  const isOwner = user?.username === report.createdBy?.username;
  const isPrivileged = user?.role === "manager" || user?.role === "admin";
  if (!isOwner && !isPrivileged) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
        <p className="text-red-600 text-lg">אין לך הרשאה לערוך דוח זה</p>
        <Button variant="outline" onClick={() => router.push("/reports")}>
          חזרה לדוחות
        </Button>
      </div>
    );
  }

  const sections: StepperSection[] = [
    { id: "private",    label: "יחידות פרטיות",  icon: LayoutList },
    { id: "iec",        label: "חברת חשמל",      icon: Zap },
    { id: "forecast",   label: "תחזית",          icon: TrendingUp },
    { id: "archive",    label: "ארכיון",          icon: Archive },
    { id: "fuels",      label: "דלקים",          icon: Fuel },
    { id: "review",     label: "סיכום ואישור",   icon: CheckCircle2 },
  ];

  return (
      <div className="min-h-screen bg-gray-50 text-[17px]" dir="rtl">
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
                  <span>{isSaving ? "מעדכן..." : "עדכן כטיוטה"}</span>
                </Button>
                <RefreshFromDbButton onRefresh={handleRefreshPrivateFromDb} disabled={isSaving} />
              </div>
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
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "מעדכן..." : "עדכן כטיוטה"}</span>
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
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "מעדכן..." : "עדכן כטיוטה"}</span>
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
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "מעדכן..." : "עדכן כטיוטה"}</span>
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
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <FileDown className="h-5 w-5" />
                  <span>{isSaving ? "מעדכן..." : "עדכן כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => setActiveSection("review")}
                  className="gap-2 text-base px-8"
                >
                  <span>סיכום ואישור</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "review" && (
          <div className="space-y-8">
            <div
              className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-4"
              dir="rtl"
            >
              <h3 className="text-lg font-semibold text-slate-800">סיכום הדוח</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                <div>
                  <span className="font-medium">כותרת: </span>
                  {title}
                </div>
                <div>
                  <span className="font-medium">תיאור: </span>
                  {subtitle}
                </div>
                <div>
                  <span className="font-medium">סטטוס: </span>
                  {report.status === "published" ? "פורסם" : "טיוטה"}
                </div>
              </div>
            </div>

            {content.forecast && (
              <ForecastSection value={content.forecast} readOnly />
            )}
            {content.archive && (
              <ArchiveSection
                value={content.archive}
                extraDays={content.archiveExtraDays}
                lastYearValue={content.lastYearArchive}
                readOnly
              />
            )}
            {content.fuels && content.fuels.length > 0 && (
              <FuelsSection value={content.fuels} sites={fuelSites} readOnly />
            )}

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
                    onClick={() => console.log("[ReportData]", { title, description: subtitle, status: report.status, content })}
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
                  <span>{isSaving ? "מעדכן..." : "עדכן כטיוטה"}</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleSave("published")}
                  disabled={isSaving}
                  className="gap-2 text-base px-8"
                >
                  <Save className="h-5 w-5" />
                  <span>{isSaving ? "מעדכן..." : "עדכן ופרסם"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
