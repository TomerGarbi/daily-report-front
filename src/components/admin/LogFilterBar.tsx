"use client";

import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { FieldDatePicker } from "@/components/inputs/FieldDatePicker";
import { Search } from "lucide-react";
import type { LogLevel } from "@/types/log";

const LEVEL_OPTIONS = [
  { value: "all", label: "כל הרמות" },
  { value: "error", label: "שגיאה" },
  { value: "warn", label: "אזהרה" },
  { value: "info", label: "מידע" },
  { value: "debug", label: "דיבאג" },
];

export interface LogFilters {
  level?: LogLevel;
  user?: string;
  context?: string;
  search?: string;
  from?: string;
  to?: string;
}

interface LogFilterBarProps {
  filters: LogFilters;
  onChange: (filters: LogFilters) => void;
  onClear: () => void;
}

function toDateStr(d: Date | undefined): string {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LogFilterBar({ filters, onChange, onClear }: LogFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Search */}
      <div className="flex-1 min-w-[160px]">
        <FieldText
          placeholder="חיפוש בהודעה…"
          startIcon={<Search className="h-4 w-4" />}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Level */}
      <div className="w-32">
        <FieldSelect
          options={LEVEL_OPTIONS}
          value={filters.level ?? "all"}
          onValueChange={(val) =>
            onChange({ ...filters, level: val === "all" ? undefined : (val as LogLevel) })
          }
        />
      </div>

      {/* User */}
      <div className="w-36">
        <FieldText
          placeholder="משתמש…"
          value={filters.user ?? ""}
          onChange={(e) => onChange({ ...filters, user: e.target.value })}
        />
      </div>

      {/* Context */}
      <div className="w-36">
        <FieldText
          placeholder="קונטקסט…"
          value={filters.context ?? ""}
          onChange={(e) => onChange({ ...filters, context: e.target.value })}
        />
      </div>

      {/* From */}
      <div className="w-40">
        <FieldDatePicker
          placeholder="מתאריך…"
          value={filters.from ? new Date(filters.from) : undefined}
          onChange={(d) => onChange({ ...filters, from: toDateStr(d) || undefined })}
        />
      </div>

      {/* To */}
      <div className="w-40">
        <FieldDatePicker
          placeholder="עד תאריך…"
          value={filters.to ? new Date(filters.to) : undefined}
          onChange={(d) => onChange({ ...filters, to: toDateStr(d) || undefined })}
        />
      </div>

      <Button type="button" variant="outline" onClick={onClear} className="gap-1.5">
        נקה
      </Button>
    </div>
  );
}
