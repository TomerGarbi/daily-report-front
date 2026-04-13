"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { reportsFilterSchema, ReportsFilterValues } from "@/lib/schemas";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportsFilterBar } from "@/components/reports/ReportsFilterBar";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { Pagination } from "@/components/Pagination";
import { FullPageSpinner } from "@/components/Spinner";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(1);

  const form = useForm<ReportsFilterValues>({
    resolver: zodResolver(reportsFilterSchema) as any,
    defaultValues: { search: "", status: [], dateFrom: "", dateTo: "" },
  });

  const filters = form.watch();

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [filters.search, filters.dateFrom, filters.dateTo, filters.status]);

  // Build server-side query from filters
  const serverStatus = filters.status?.length === 1 ? filters.status[0] : undefined;

  const {
    reports,
    total,
    totalPages,
    isLoading: reportsFetching,
    error,
  } = useReports({
    status: serverStatus,
    search: filters.search || undefined,
    createdAfter: filters.dateFrom || undefined,
    createdBefore: filters.dateTo || undefined,
    page,
    limit: PAGE_SIZE,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  // Derive today's report from the current page
  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const todayReport = reports.find(
    (r) => new Date(r.createdAt).toLocaleDateString("en-CA") === todayStr
  );
  const hasTodayReport = !!todayReport;
  const todayReportId  = todayReport?.id;

  function onSubmit(_values: ReportsFilterValues) {
    setPage(1);
  }

  function clearFilters() {
    form.reset({ search: "", status: [], dateFrom: "", dateTo: "" });
    setPage(1);
  }

  if (authLoading) {
    return <FullPageSpinner label="טוען דוחות…" />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <ReportsHeader
          hasTodayReport={hasTodayReport}
          todayReportId={todayReportId}
          isLoading={reportsFetching && reports.length === 0}
        />

        {/* Filter Bar */}
        <ReportsFilterBar form={form} onSubmit={onSubmit} onClear={clearFilters} />

        {/* Table */}
        <ReportsTable
          reports={reports}
          isLoading={reportsFetching}
          error={error ? String(error) : null}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {`${total} דוחות • עמוד ${page} מתוך ${totalPages}`}
          </span>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={reportsFetching}
          />
        </div>

      </div>
    </div>
  );
}
