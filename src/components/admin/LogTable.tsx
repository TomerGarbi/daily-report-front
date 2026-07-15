"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/Spinner";
import type { LogEntry } from "@/types/log";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const LEVEL_STYLES: Record<string, string> = {
  error: "bg-rose-100 text-rose-700 border-rose-200",
  warn:  "bg-amber-100 text-amber-700 border-amber-200",
  info:  "bg-blue-100 text-blue-700 border-blue-200",
  debug: "bg-slate-100 text-slate-600 border-slate-200",
};

const LEVEL_LABELS: Record<string, string> = {
  error: "שגיאה",
  warn:  "אזהרה",
  info:  "מידע",
  debug: "דיבאג",
};

interface LogTableProps {
  logs: LogEntry[];
  isLoading: boolean;
  error?: string | null;
  onSelect?: (log: LogEntry) => void;
}

export function LogTable({ logs, isLoading, error, onSelect }: LogTableProps) {
  const tErrors = useTranslations("errors.sections");
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-700 hover:bg-slate-700">
            <TableHead className="text-right font-semibold text-white w-40">זמן</TableHead>
            <TableHead className="text-right font-semibold text-white w-20">רמה</TableHead>
            <TableHead className="text-right font-semibold text-white">הודעה</TableHead>
            <TableHead className="text-right font-semibold text-white w-28">משתמש</TableHead>
            <TableHead className="text-right font-semibold text-white w-32">קונטקסט</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-16">
                <Spinner size="md" label="טוען לוגים…" className="mx-auto" />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="py-16 text-center text-rose-500">
                {tErrors("logs")}
              </TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                לא נמצאו לוגים
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log, idx) => (
              <TableRow
                key={log._id}
                className={`transition-colors cursor-pointer ${
                  idx % 2 === 0
                    ? "bg-white hover:bg-slate-50"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
                onClick={() => onSelect?.(log)}
              >
                <TableCell className="text-slate-500 tabular-nums text-xs">
                  {formatTimestamp(log.timestamp)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info}`}
                  >
                    {LEVEL_LABELS[log.level] ?? log.level}
                  </span>
                </TableCell>
                <TableCell className="text-slate-800 text-sm truncate max-w-xs">
                  {log.message}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {log.user}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {log.context ?? "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
