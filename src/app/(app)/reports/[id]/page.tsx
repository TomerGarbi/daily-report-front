"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, ArrowRight, Calendar, User, Tag, Pencil } from "lucide-react";
import { useReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { FuelGroupedTables } from "@/components/reports/FuelGroupedTables";
import { ForecastSection } from "@/components/reports/forecast/ForecastSection";
import { ArchiveSection } from "@/components/reports/ArchiveSection";
import { FuelsSection } from "@/components/reports/FuelsSection";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { fetchFuelSites } from "@/lib/fuel-sites-api";
import type { FuelSite } from "@/types/fuelSite";
import { normalizeReportContent } from "@/types/report";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  return status === "published" ? "פורסם" : "טיוטה";
}

function statusColor(status: string) {
  return status === "published"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-amber-100 text-amber-700 border-amber-200";
}

function hasData(d?: Record<string, unknown>) {
  return d && Object.keys(d).length > 0;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReportViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { report, isLoading, error } = useReport(id);
  const [fuelSites, setFuelSites] = useState<FuelSite[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchFuelSites()
      .then((s) => { if (!cancelled) setFuelSites(s); })
      .catch((err) => console.error("[ReportView] fetchFuelSites failed:", err));
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="טוען דוח…" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
        <p className="text-red-600 text-lg">
          {error?.message ?? "הדוח לא נמצא"}
        </p>
        <Button variant="outline" onClick={() => router.push("/reports")}>
          חזרה לדוחות
        </Button>
      </div>
    );
  }

  const content = normalizeReportContent(report.content);
  const hasPrivate = hasData(content.private);
  const hasIec     = hasData(content.iec);

  const canEdit =
    user?.role === "manager" ||
    user?.role === "admin" ||
    user?.username === report.createdBy?.username;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm mt-1">
            <FileText className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800">{report.title}</h1>
            {report.description && (
              <p className="text-sm text-slate-500 mt-0.5">{report.description}</p>
            )}

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-medium ${statusColor(report.status)}`}
              >
                <Tag className="h-3 w-3" />
                {statusLabel(report.status)}
              </span>

              {report.createdBy?.username && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {report.createdBy.username}
                </span>
              )}

              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(report.createdAt)}
              </span>

              {report.updatedAt && report.updatedAt !== report.createdAt && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="inline-flex items-center gap-1">
                    <Pencil className="h-3 w-3" />
                    נערך ע״י {report.updatedBy?.username ?? "—"} ב-{formatDate(report.updatedAt)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/reports/${id}/edit`)}
                className="gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                עריכת דוח
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/reports")}
              className="gap-1.5"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה לדוחות
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body: all sections concatenated ────────────────────────── */}
      <div className="w-full px-6 py-8 space-y-8">
        {hasPrivate && (
          <FuelGroupedTables
            buckets={content.private}
            titlePrefix="יחידות פרטיות"
            readOnly
          />
        )}

        {hasIec && (
          <FuelGroupedTables
            buckets={content.iec}
            titlePrefix="חברת חשמל"
            readOnly
          />
        )}

        {content.forecast && (
          <ForecastSection value={content.forecast} readOnly />
        )}

        <ArchiveSection
          value={content.archive}
          extraDays={content.archiveExtraDays}
          lastYearValue={content.lastYearArchive}
          readOnly
        />

        {content.fuels && content.fuels.length > 0 && (
          <FuelsSection value={content.fuels} sites={fuelSites} readOnly />
        )}

        {!hasPrivate && !hasIec && !content.forecast && (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center text-slate-500">
            אין נתוני תחנות בדוח זה
          </div>
        )}
      </div>
    </div>
  );
}
