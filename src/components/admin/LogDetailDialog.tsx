"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LogEntry } from "@/types/log";

const LEVEL_LABELS: Record<string, string> = {
  error: "שגיאה",
  warn:  "אזהרה",
  info:  "מידע",
  debug: "דיבאג",
};

const LEVEL_STYLES: Record<string, string> = {
  error: "bg-rose-100 text-rose-700 border-rose-200",
  warn:  "bg-amber-100 text-amber-700 border-amber-200",
  info:  "bg-blue-100 text-blue-700 border-blue-200",
  debug: "bg-slate-100 text-slate-600 border-slate-200",
};

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

interface LogDetailDialogProps {
  log: LogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDetailDialog({ log, open, onOpenChange }: LogDetailDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info}`}
            >
              {LEVEL_LABELS[log.level] ?? log.level}
            </span>
            פרטי לוג
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <span className="font-medium text-slate-500">זמן:</span>
            <span className="tabular-nums">{formatTimestamp(log.timestamp)}</span>

            <span className="font-medium text-slate-500">משתמש:</span>
            <span>{log.user}</span>

            {log.context && (
              <>
                <span className="font-medium text-slate-500">קונטקסט:</span>
                <span>{log.context}</span>
              </>
            )}

            <span className="font-medium text-slate-500">ID:</span>
            <span className="font-mono text-xs text-slate-400">{log._id}</span>
          </div>

          <div>
            <span className="font-medium text-slate-500">הודעה:</span>
            <p className="mt-1 rounded-lg bg-slate-50 border border-slate-200 p-3 text-slate-800 whitespace-pre-wrap break-words">
              {log.message}
            </p>
          </div>

          {log.meta && Object.keys(log.meta).length > 0 && (
            <div>
              <span className="font-medium text-slate-500">מטא-דאטה:</span>
              <pre className="mt-1 rounded-lg bg-slate-900 text-slate-100 p-3 text-xs overflow-x-auto" dir="ltr">
                {JSON.stringify(log.meta, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
