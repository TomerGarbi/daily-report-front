"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, LayoutList, CheckCircle2, ArrowLeft, ArrowRight, Zap, Save, ClipboardList, FileDown } from "lucide-react";
import { StepperHeader } from "@/components/StepperHeader";
import type { StepperSection } from "@/components/StepperHeader";
import { StationTable } from "@/components/StationTable/StationTable";
import type { StationData } from "@/types/report";
import { Button } from "@/components/ui/button";
import { useReport, useReportMutations } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

// ─── Section definitions ────────────────────────────────────────────────────

const SECTION_IDS = ["content", "electric", "additional", "review"] as const;
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
  const [activeSection, setActiveSection] = useState<SectionId>("content");
  const [stationData, setStationData] = useState<StationData>({});
  const [gasData, setGasData] = useState<StationData>({});
  const [renewableData, setRenewableData] = useState<StationData>({});
  const [electricData, setElectricData] = useState<StationData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ── Populate state from fetched report ────────────────────────────────
  useEffect(() => {
    if (report && !initialized) {
      setTitle(report.title);
      setSubtitle(report.description);
      setStationData(report.content?.stationData ?? {});
      setGasData(report.content?.gasData ?? {});
      setRenewableData(report.content?.renewableData ?? {});
      setElectricData(report.content?.electricData ?? {});
      setInitialized(true);
    }
  }, [report, initialized]);

  // ── Warn on refresh / tab close ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ── Save (draft or published) ─────────────────────────────────────────
  const handleSave = useCallback(
    async (status: "draft" | "published") => {
      setIsSaving(true);
      try {
        const payload = {
          title,
          description: subtitle,
          status,
          content: { stationData, gasData, renewableData, electricData },
        };
        await updateReport(id, payload);
        toast.success(status === "draft" ? "הדוח עודכן כטיוטה" : "הדוח עודכן בהצלחה");
        router.push("/reports");
      } catch (err: unknown) {
        console.error("[EditReport] error:", err);
        const apiErr = err as { message?: string; status?: number; body?: Record<string, unknown> };

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
          toast.error(apiErr.message ?? "שגיאה בעדכון הדוח");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [id, title, subtitle, stationData, gasData, renewableData, electricData, updateReport, router],
  );

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

  // ── Authorization: only owner, manager, or admin may edit ─────────────
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
                <div><span className="font-medium">קבוצה: </span>{report.group ?? "—"}</div>
                <div><span className="font-medium">סטטוס: </span>{report.status === "published" ? "פורסם" : "טיוטה"}</div>
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
