"use client";

import { Report } from "@/types/report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { ReportRowActions } from "@/components/reports/ReportRowActions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface ReportsTableProps {
  reports: Report[];
  isLoading: boolean;
  error?: string | null;
  onDelete?: (reportId: string) => void;
}

export function ReportsTable({
  reports,
  isLoading,
  error,
  onDelete,
}: ReportsTableProps) {
  return (
    <div className="rounded-2xl border border-orange-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-orange-500 hover:bg-orange-500">
            <TableHead className="text-right font-semibold text-white">כותרת</TableHead>
            <TableHead className="text-right font-semibold text-white">מגיש</TableHead>
            <TableHead className="text-right font-semibold text-white">תאריך יצירה</TableHead>
            <TableHead className="text-right font-semibold text-white">סטטוס</TableHead>
            <TableHead className="text-right font-semibold text-white">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-16">
                <div role="status" aria-live="polite">
                  <Spinner size="md" label="טוען דוחות…" className="mx-auto" />
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={5}
                role="alert"
                aria-live="assertive"
                className="py-16 text-center text-rose-500"
              >
                שגיאה בטעינת הדוחות
              </TableCell>
            </TableRow>
          ) : reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                לא נמצאו דוחות
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report, idx) => (
              <TableRow
                key={report.id}
                className={`transition-colors ${
                  idx % 2 === 0
                    ? "bg-white hover:bg-orange-50"
                    : "bg-orange-100 hover:bg-orange-200"
                }`}
              >
                <TableCell className="font-medium text-slate-800">
                  {report.title}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {report.createdBy?.username ?? "—"}
                </TableCell>
                <TableCell className="text-slate-500 tabular-nums">
                  {formatDate(report.createdAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={report.status} />
                </TableCell>
                <TableCell>
                  <ReportRowActions
                    reportId={report.id}
                    reportAuthor={report.createdBy?.username}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
