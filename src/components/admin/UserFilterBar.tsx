"use client";

import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { Search } from "lucide-react";
import type { UserRole } from "@/types/user";

const ROLE_OPTIONS = [
  { value: "all", label: "כל התפקידים" },
  { value: "admin", label: "מנהל" },
  { value: "manager", label: "מנהל ביניים" },
  { value: "user", label: "משתמש" },
  { value: "guest", label: "אורח" },
];

export interface UserFilters {
  role?: UserRole;
  search?: string;
}

interface UserFilterBarProps {
  filters: UserFilters;
  onChange: (filters: UserFilters) => void;
  onClear: () => void;
}

export function UserFilterBar({ filters, onChange, onClear }: UserFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <FieldText
          placeholder="חיפוש לפי שם משתמש…"
          startIcon={<Search className="h-4 w-4" />}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Role */}
      <div className="w-40">
        <FieldSelect
          options={ROLE_OPTIONS}
          value={filters.role ?? "all"}
          onValueChange={(val) =>
            onChange({ ...filters, role: val === "all" ? undefined : (val as UserRole) })
          }
        />
      </div>

      <Button type="button" variant="outline" onClick={onClear} className="gap-1.5">
        נקה
      </Button>
    </div>
  );
}
