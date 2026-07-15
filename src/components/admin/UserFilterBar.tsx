"use client";

import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { Search, Activity, Moon, Ban, UserX, X } from "lucide-react";
import type { UserRole, UserStatus } from "@/types/user";

const ROLE_OPTIONS = [
  { value: "all",     label: "כל התפקידים" },
  { value: "admin",   label: "מנהל" },
  { value: "manager", label: "מנהל ביניים" },
  { value: "user",    label: "משתמש" },
  { value: "guest",   label: "אורח" },
];

const STATUS_OPTIONS = [
  { value: "all",           label: "כל הסטטוסים" },
  { value: "active",        label: "פעילים (30 ימים)" },
  { value: "dormant",       label: "רדומים" },
  { value: "disabled",      label: "מושבתים" },
  { value: "neverLoggedIn", label: "לא התחברו מעולם" },
];

export interface UserFilters {
  role?: UserRole;
  search?: string;
  status?: UserStatus;
}

interface UserFilterBarProps {
  filters: UserFilters;
  onChange: (filters: UserFilters) => void;
  onClear: () => void;
}

/**
 * Quick-select chip. Sets `filters.status` to a preset in one click so admins
 * don't need to fiddle with dropdowns for the most common triage queries.
 */
function QuickChip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-slate-800 bg-slate-800 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function UserFilterBar({ filters, onChange, onClear }: UserFilterBarProps) {
  // Quick-chip helper: setting the same chip twice clears the filter.
  const toggleStatus = (next: UserStatus) => {
    onChange({ ...filters, status: filters.status === next ? undefined : next });
  };

  const hasAnyFilter =
    !!filters.role || !!filters.search || !!filters.status;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Row 1 — main controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <FieldText
            placeholder="חיפוש לפי שם משתמש…"
            startIcon={<Search className="h-4 w-4" />}
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="w-40">
          <FieldSelect
            options={ROLE_OPTIONS}
            value={filters.role ?? "all"}
            onValueChange={(val) =>
              onChange({ ...filters, role: val === "all" ? undefined : (val as UserRole) })
            }
          />
        </div>

        <div className="w-52">
          <FieldSelect
            options={STATUS_OPTIONS}
            value={filters.status ?? "all"}
            onValueChange={(val) =>
              onChange({ ...filters, status: val === "all" ? undefined : (val as UserStatus) })
            }
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          disabled={!hasAnyFilter}
          className="gap-1.5"
        >
          <X className="h-4 w-4" />
          נקה
        </Button>
      </div>

      {/* Row 2 — quick chips (one-click presets for the common triage queries) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 me-1">מסננים מהירים:</span>
        <QuickChip
          label="פעילים עכשיו"
          icon={Activity}
          active={filters.status === "active"}
          onClick={() => toggleStatus("active")}
        />
        <QuickChip
          label="רדומים 30+ יום"
          icon={Moon}
          active={filters.status === "dormant"}
          onClick={() => toggleStatus("dormant")}
        />
        <QuickChip
          label="לא התחברו מעולם"
          icon={UserX}
          active={filters.status === "neverLoggedIn"}
          onClick={() => toggleStatus("neverLoggedIn")}
        />
        <QuickChip
          label="מושבתים"
          icon={Ban}
          active={filters.status === "disabled"}
          onClick={() => toggleStatus("disabled")}
        />
      </div>
    </div>
  );
}
