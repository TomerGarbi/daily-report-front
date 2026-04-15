"use client";

import { useParams, useRouter } from "next/navigation";
import { FileText, ArrowRight, Calendar, User, Tag, Pencil } from "lucide-react";
import { useReport } from "@/hooks/useReports";
import { StationTable } from "@/components/StationTable/StationTable";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import type { StationData } from "@/types/report";

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

function hasData(d?: StationData) {
  return d && Object.keys(d).length > 0;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReportViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { report, isLoading, error } = useReport(id);

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

  const { stationData, gasData, renewableData, electricData } = report.content ?? {};

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

              {report.group && (
                <span className="text-slate-400">|</span>
              )}
              {report.group && (
                <span>{report.group}</span>
              )}

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

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/reports")}
            className="gap-1.5 shrink-0"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה לדוחות
          </Button>
        </div>
      </div>

      {/* ── Body: all sections concatenated ────────────────────────── */}
      <div className="w-full px-6 py-8 space-y-8">
        {hasData(stationData) && (
          <StationTable
            title="תחנות כוח קונבנציונליות"
            data={stationData!}
            readOnly
          />
        )}

        {hasData(gasData) && (
          <StationTable
            title="תחנות גז טבעי"
            data={gasData!}
            readOnly
          />
        )}

        {hasData(renewableData) && (
          <StationTable
            title="תחנות אנרגיה מתחדשת"
            data={renewableData!}
            readOnly
          />
        )}

        {hasData(electricData) && (
          <StationTable
            title="חברת חשמל"
            data={electricData!}
            readOnly
          />
        )}

        {!hasData(stationData) && !hasData(gasData) && !hasData(renewableData) && !hasData(electricData) && (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center text-slate-500">
            אין נתוני תחנות בדוח זה
          </div>
        )}
      </div>
    </div>
  );
}
