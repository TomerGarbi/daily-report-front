"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, CheckCircle2 } from "lucide-react";

interface ReportsHeaderProps {
  /** Whether a report was already created today */
  hasTodayReport: boolean;
  /** The id of today's report — used to navigate to it */
  todayReportId?: string;
  /** Show skeleton while the today-check is still loading */
  isLoading?: boolean;
}

export function ReportsHeader({
  hasTodayReport,
  todayReportId,
  isLoading = false,
}: ReportsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">

      {/* Right side — title + description */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ארכיון דוחות</h1>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          כאן תמצא את כל הדוחות שנשמרו במערכת, עם אפשרות לחיפוש, סינון וניהול.
        </p>
      </div>

      {/* Left side — today's report CTA */}
      <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
        {isLoading ? (
          <div className="h-10 w-44 animate-pulse rounded-lg bg-slate-100" />
        ) : hasTodayReport ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              הדוח של היום כבר הוגש
            </div>
            <Button
              variant="outline"
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() =>
                router.push(todayReportId ? `/reports/${todayReportId}` : "/reports")
              }
            >
              <FileText className="h-4 w-4" />
              צפה בדוח של היום
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">טרם הוגש דוח להיום</p>
            <Button
              className="gap-2 bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => router.push("/reports/new")}
            >
              <PlusCircle className="h-4 w-4" />
              צור דוח להיום
            </Button>
          </>
        )}
      </div>

    </div>
  );
}
