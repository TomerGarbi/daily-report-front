
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, LayoutList, CheckCircle2, ArrowLeft, ArrowRight, Zap, Save, ClipboardList, FileDown, Copy, Database, FilePlus2 } from "lucide-react";
import { StepperHeader } from "@/components/StepperHeader";
import type { StepperSection } from "@/components/StepperHeader";
import { StationTable } from "@/components/StationTable/StationTable";
import type { StationData, ReportContent } from "@/types/report";
import { Button } from "@/components/ui/button";
import { useReportMutations } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { fetchLatestReport, fetchDefaultStations } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

// ─── Creation mode types ────────────────────────────────────────────────────

type CreationMode = "last-report" | "db-defaults" | "scratch";

// ─── Empty station data ─────────────────────────────────────────────────────

const EMPTY_STATIONS: StationData = {};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayTitle() {
  const d = new Date();
  return `דוח יומי - ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const DAY_NAMES_HE = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];

function getDayDescription() {
  return `דוח יומי ל${DAY_NAMES_HE[new Date().getDay()]}`;
}

// ─── Section definitions ────────────────────────────────────────────────────

const SECTION_IDS = ["content", "electric", "additional", "review"] as const;
type SectionId = (typeof SECTION_IDS)[number];

// ─── Mode Selection Card ────────────────────────────────────────────────────

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
  const authFetch = useAuthFetch();
  const { createReport } = useReportMutations();

  // Mode selection state
  const [mode, setMode] = useState<CreationMode | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [title, setTitle] = useState(getTodayTitle());
  const [subtitle, setSubtitle] = useState(getDayDescription());
  const [activeSection, setActiveSection] = useState<SectionId>("content");
  const [stationData, setStationData] = useState<StationData>(EMPTY_STATIONS);
  const [gasData, setGasData] = useState<StationData>(EMPTY_STATIONS);
  const [renewableData, setRenewableData] = useState<StationData>(EMPTY_STATIONS);
  const [electricData, setElectricData] = useState<StationData>(EMPTY_STATIONS);
  const [isSaving, setIsSaving] = useState(false);

  // ── Apply fetched content to state ────────────────────────────────────
  const applyContent = useCallback((content: ReportContent) => {
    setStationData(content.stationData ?? {});
    setGasData(content.gasData ?? {});
    setRenewableData(content.renewableData ?? {});
    setElectricData(content.electricData ?? {});
  }, []);

  // ── Handle mode selection ─────────────────────────────────────────────
  const handleModeSelect = useCallback(
    async (selected: CreationMode) => {
      if (selected === "scratch") {
        setStationData(EMPTY_STATIONS);
        setGasData(EMPTY_STATIONS);
        setRenewableData(EMPTY_STATIONS);
        setElectricData(EMPTY_STATIONS);
        setMode(selected);
        return;
      }

      setIsLoadingData(true);
      try {
        if (selected === "last-report") {
          const report = await fetchLatestReport(authFetch);
          if (report?.content) {
            applyContent(report.content);
          } else {
            toast.error("לא נמצא דוח קודם — נפתח דוח ריק");
          }
        } else if (selected === "db-defaults") {
          const defaults = await fetchDefaultStations(authFetch);
          if (defaults) {
            applyContent(defaults);
          } else {
            toast.error("לא נמצאו נתוני ברירת מחדל — נפתח דוח ריק");
          }
        }
        setMode(selected);
      } catch {
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setIsLoadingData(false);
      }
    },
    [authFetch, applyContent],
  );

  // ── Warn on refresh / tab close (only after mode is chosen) ───────────
  useEffect(() => {
    if (!mode) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [mode]);

  // ── Save (draft or published) ─────────────────────────────────────────
  const handleSave = useCallback(
    async (status: "draft" | "published") => {
      setIsSaving(true);
      try {
        const payload = {
          title,
          description: subtitle,
          group: user?.groups?.[0] ?? "",
          status,
          content: { stationData, gasData, renewableData, electricData },
        };
        console.log("[SaveReport] payload:", payload);
        await createReport(payload);
        toast.success(status === "draft" ? "הדוח נשמר כטיוטה" : "הדוח נשמר בהצלחה");
        router.push("/reports");
      } catch (err: unknown) {
        console.error("[SaveReport] error:", err);
        const apiErr = err as { message?: string; status?: number; body?: Record<string, unknown> };
        console.error("[SaveReport] status:", apiErr.status);
        console.error("[SaveReport] body:", apiErr.body);

        const errors = apiErr.body?.errors;
        if (Array.isArray(errors)) {
          const details = errors
            .map((e: { field?: string; message?: string }) => `${e.field ?? "?"}: ${e.message ?? "שגיאה"}`)
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
    [title, subtitle, user, stationData, gasData, renewableData, electricData, createReport, router],
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <ModeCard
                icon={Copy}
                title="המשך מדוח אחרון"
                description="צור דוח חדש עם הנתונים מהדוח האחרון שהוגש"
                onClick={() => handleModeSelect("last-report")}
                disabled={isLoadingData}
              />
              <ModeCard
                icon={Database}
                title="נתוני ברירת מחדל"
                description="טען את נתוני ברירת המחדל מהמערכת ועדכן לפי הצורך"
                onClick={() => handleModeSelect("db-defaults")}
                disabled={isLoadingData}
              />
              <ModeCard
                icon={FilePlus2}
                title="דוח ריק"
                description="התחל דוח חדש מאפס ללא נתונים מוגדרים מראש"
                onClick={() => handleModeSelect("scratch")}
                disabled={isLoadingData}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Stepper form (after mode is selected) ─────────────────────────────

  const sections: StepperSection[] = [
    { id: "content", label: "יחידות פרטיות", icon: LayoutList },
    { id: "electric", label: "חברת חשמל", icon: Zap },
    { id: "additional", label: "נתונים נוספים", icon: ClipboardList },
    { id: "review", label: "סיכום ואישור", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
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

      <div className="w-full px-6 py-8">
        {activeSection === "content" && (
          <div className="space-y-8">
            <StationTable title="תחנות כוח קונבנציונליות" data={stationData} onChange={setStationData} />
            <StationTable title="תחנות גז טבעי" data={gasData} onChange={setGasData} />
            <StationTable title="תחנות אנרגיה מתחדשת" data={renewableData} onChange={setRenewableData} />

            <div className="flex justify-between">
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
              <Button size="lg" onClick={() => setActiveSection("electric")} className="gap-2 text-base px-8">
                <span>חברת חשמל</span>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {activeSection === "electric" && (
          <div className="space-y-8">
            <StationTable title="חברת חשמל" data={electricData} onChange={setElectricData} />

            <div className="flex justify-between">
              <Button size="lg" variant="outline" onClick={() => setActiveSection("content")} className="gap-2 text-base px-8">
                <ArrowRight className="h-5 w-5" />
                <span>חזרה ליחידות פרטיות</span>
              </Button>
              <div className="flex gap-3">
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
                <Button size="lg" onClick={() => setActiveSection("additional")} className="gap-2 text-base px-8">
                  <span>נתונים נוספים</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "additional" && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center text-slate-500">
              נתונים נוספים — בקרוב
            </div>

            <div className="flex justify-between">
              <Button size="lg" variant="outline" onClick={() => setActiveSection("electric")} className="gap-2 text-base px-8">
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לחברת חשמל</span>
              </Button>
              <div className="flex gap-3">
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
                <Button size="lg" onClick={() => setActiveSection("review")} className="gap-2 text-base px-8">
                  <span>סיכום ואישור</span>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "review" && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-4" dir="rtl">
              <h3 className="text-lg font-semibold text-slate-800">סיכום הדוח</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                <div><span className="font-medium">כותרת: </span>{title}</div>
                <div><span className="font-medium">תיאור: </span>{subtitle}</div>
                <div><span className="font-medium">קבוצה: </span>{user?.groups?.[0] ?? "—"}</div>
                <div><span className="font-medium">סטטוס: </span>פורסם</div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button size="lg" variant="outline" onClick={() => setActiveSection("additional")} className="gap-2 text-base px-8" disabled={isSaving}>
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לנתונים נוספים</span>
              </Button>
              <div className="flex gap-3">
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