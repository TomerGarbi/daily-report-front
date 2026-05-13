"use client";

import { useCallback, useMemo, useState } from "react";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { FieldDatePicker } from "@/components/inputs/FieldDatePicker";
import type { SelectOption } from "@/components/inputs/FieldSelect";
import { AlertTriangle, Plus, Pencil, X, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StationRow, StationData, StationStatus } from "@/types/report";
import { CatalogPickerDialog } from "@/components/StationTable/CatalogPickerDialog";
import { usePreferences } from "@/components/PreferencesProvider";

export type { StationRow, StationData };

interface StationTableProps {
  data: StationData;
  onChange?: (data: StationData) => void;
  title?: string;
  readOnly?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// NOTE: The static `STATUS_OPTIONS` and `statusColor` / `statusLabel` below
// are the fall-back defaults. The component overrides them at runtime with
// the user's preferences (see `prefs.statuses` usage below).
const STATUS_OPTIONS: SelectOption[] = [
  { value: "Active", label: "פעיל" },
  { value: "Inactive", label: "לא פעיל" },
  { value: "Maintenance", label: "תחזוקה" },
];

function statusColor(status: string) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Inactive":
      return "bg-red-100 text-slate-600 border-slate-200";
    case "Maintenance":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}


function statusLabel(status: string) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COL_HEADERS: { label: string; sub?: string }[] = [
  { label: "שם יחידה" },
  { label: "מספר יחידה" },
  { label: "יכולת מותקנת", sub: "(MW) | 15°C" },
  { label: "יכולת זמינה כעת", sub: "(MW)" },
  { label: "יכולת לשעת פסגה", sub: "(MW)" },
  { label: "יכולת לשעת מינימום רזרבה", sub: "(MW)" },
  { label: "יכולת זמינה בפסגה בדלק משני", sub: "(MW)" },
  { label: "התדרדרות ביכולת", sub: "(MW)" },
  { label: "סטטוס" },
  { label: "זמן התחלה" },
  { label: "זמן סיום" },
  { label: "זמן סיום מעודכן" },
  { label: "הערות" },
];

// ─── Validation ─────────────────────────────────────────────────────────────

interface ValidationError {
  group: string;
  rowIdx: number;
  field: string;
  message: string;
}

function validateStationData(data: StationData): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [group, rows] of Object.entries(data)) {
    rows.forEach((row, rowIdx) => {
      const label = `${group} - יחידה ${row.stationNumber}`;

      // Capacity values must be non-negative
      if (row.installedCapacity < 0)
        errors.push({ group, rowIdx, field: "יכולת מותקנת", message: `${label}: יכולת מותקנת לא יכולה להיות שלילית` });
      if (row.availableCapacity < 0)
        errors.push({ group, rowIdx, field: "יכולת זמינה", message: `${label}: יכולת זמינה לא יכולה להיות שלילית` });
      if (row.peakCapacity < 0)
        errors.push({ group, rowIdx, field: "יכולת פסגה", message: `${label}: יכולת לשעת פסגה לא יכולה להיות שלילית` });
      if (row.minReserveCapacity < 0)
        errors.push({ group, rowIdx, field: "יכולת מינימום רזרבה", message: `${label}: יכולת לשעת מינימום רזרבה לא יכולה להיות שלילית` });
      if (row.secondaryFuelPeakCapacity < 0)
        errors.push({ group, rowIdx, field: "יכולת דלק משני", message: `${label}: יכולת בדלק משני לא יכולה להיות שלילית` });

      // Available capacity cannot exceed installed capacity
      if (row.availableCapacity > row.installedCapacity)
        errors.push({ group, rowIdx, field: "יכולת זמינה", message: `${label}: יכולת זמינה (${row.availableCapacity}) חורגת מיכולת מותקנת (${row.installedCapacity})` });

      // Peak capacity cannot exceed installed capacity
      if (row.peakCapacity > row.installedCapacity)
        errors.push({ group, rowIdx, field: "יכולת פסגה", message: `${label}: יכולת לשעת פסגה (${row.peakCapacity}) חורגת מיכולת מותקנת (${row.installedCapacity})` });

      // Secondary fuel peak capacity cannot exceed installed capacity
      if (row.secondaryFuelPeakCapacity > row.installedCapacity)
        errors.push({ group, rowIdx, field: "יכולת דלק משני", message: `${label}: יכולת בדלק משני (${row.secondaryFuelPeakCapacity}) חורגת מיכולת מותקנת (${row.installedCapacity})` });

      // Inactive/Maintenance units should have 0 available capacity
      if (row.status !== "Active" && row.availableCapacity > 0)
        errors.push({ group, rowIdx, field: "סטטוס", message: `${label}: יחידה בסטטוס "${STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status}" עם יכולת זמינה גדולה מ-0` });

      // End time must be after start time
      if (row.startTime && row.endTime && new Date(row.endTime) <= new Date(row.startTime))
        errors.push({ group, rowIdx, field: "זמן סיום", message: `${label}: זמן סיום חייב להיות אחרי זמן התחלה` });

      // Updated end time must be after start time
      if (row.startTime && row.updatedEndTime && new Date(row.updatedEndTime) <= new Date(row.startTime))
        errors.push({ group, rowIdx, field: "זמן סיום מעודכן", message: `${label}: זמן סיום מעודכן חייב להיות אחרי זמן התחלה` });

      // Active unit should have a start time
      if (row.status === "Active" && !row.startTime)
        errors.push({ group, rowIdx, field: "זמן התחלה", message: `${label}: יחידה פעילה חייבת לכלול זמן התחלה` });
    });
  }

  return errors;
}

function ValidationPanel({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
        <h4 className="text-sm font-semibold text-red-700">
          נמצאו {errors.length} שגיאות
        </h4>
      </div>
      <ul className="space-y-1 mr-7">
        {errors.map((err, i) => (
          <li key={i} className="text-sm text-red-600">
            • {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function StationTable({ data, onChange, title, readOnly = false }: StationTableProps) {
  const canEdit = !readOnly && !!onChange;
  const [editing, setEditing] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Pull user-customised status labels & colours from preferences and
  // override the static defaults defined above. Falls back to the static
  // values via the `usePreferences` provider's defaults.
  const { prefs } = usePreferences();
  const statusOptions: SelectOption[] = useMemo(
    () => (Object.keys(prefs.statuses) as Array<keyof typeof prefs.statuses>).map((k) => ({
      value: k,
      label: prefs.statuses[k].label,
    })),
    [prefs.statuses],
  );
  const labelFor = useCallback(
    (s: string) => prefs.statuses[s as keyof typeof prefs.statuses]?.label ?? s,
    [prefs.statuses],
  );
  const colorFor = useCallback(
    (s: string) =>
      prefs.statuses[s as keyof typeof prefs.statuses]?.color ?? statusColor(s),
    [prefs.statuses],
  );

  const addStation = useCallback(
    (name: string) => {
      if (!onChange || !name.trim()) return;
      const trimmed = name.trim();
      if (data[trimmed]) return; // already exists
      const newRow: StationRow = {
        stationNumber: 1,
        installedCapacity: 0,
        availableCapacity: 0,
        peakCapacity: 0,
        minReserveCapacity: 0,
        secondaryFuelPeakCapacity: 0,
        status: "Active",
      };
      onChange({ ...data, [trimmed]: [newRow] });
    },
    [data, onChange]
  );

  const updateRow = useCallback(
    (group: string, rowIdx: number, patch: Partial<StationRow>) => {
      if (!onChange) return;
      const updated = { ...data };
      updated[group] = updated[group].map((row, i) =>
        i === rowIdx ? { ...row, ...patch } : row
      );
      onChange(updated);
    },
    [data, onChange]
  );

  const addRow = useCallback(
    (group: string) => {
      if (!onChange) return;
      const rows = data[group] ?? [];
      const maxStation = rows.reduce((max, r) => Math.max(max, r.stationNumber), 0);
      const newRow: StationRow = {
        stationNumber: maxStation + 1,
        installedCapacity: 0,
        availableCapacity: 0,
        peakCapacity: 0,
        minReserveCapacity: 0,
        secondaryFuelPeakCapacity: 0,
        status: "Active",
      };
      const updated = { ...data, [group]: [...rows, newRow] };
      onChange(updated);
    },
    [data, onChange]
  );

  /**
   * Add a row sourced from the station/unit catalog.
   *
   * If a group with the picked station's name already exists in the table,
   * the new unit is appended as another row in that group (preserving the
   * existing layout where rows from the same station are visually merged).
   * Otherwise a fresh group is created.
   *
   * `installedCapacity`, `mainFuel` and `secondaryFuels` are copied from
   * the catalog and become read-only in the report (locking is enforced
   * in the render layer below via `row.stationId`).
   */
  const addFromCatalog = useCallback(
    (
      stationName: string,
      stationId: string,
      unit: { id?: string; _id?: string; tag: string; installedCapacity: number; mainFuel: string; secondaryFuels: string[] },
    ) => {
      if (!onChange) return;

      const groupName = stationName.trim() || "תחנה";
      const rows = data[groupName] ?? [];
      const unitId = unit.id ?? unit._id;

      // Don't allow duplicating the same unit on the same report.
      if (unitId && rows.some((r) => r.unitId === unitId)) return;

      const maxStation = rows.reduce((max, r) => Math.max(max, r.stationNumber), 0);
      const newRow: StationRow = {
        stationNumber:             Number(unit.tag) || maxStation + 1,
        installedCapacity:         Number(unit.installedCapacity) || 0,
        availableCapacity:         0,
        peakCapacity:              0,
        minReserveCapacity:        0,
        secondaryFuelPeakCapacity: 0,
        status:                    "Active",
        stationId,
        unitId,
        mainFuel:                  unit.mainFuel,
        secondaryFuels:            [...(unit.secondaryFuels ?? [])],
      };

      onChange({ ...data, [groupName]: [...rows, newRow] });
    },
    [data, onChange],
  );

  const groups = Object.keys(data);

  const totals = useMemo(() => {
    let installed = 0;
    let available = 0;
    let peak = 0;
    let minReserve = 0;
    let secondaryFuel = 0;
    const byStatus: Record<string, { count: number; installed: number; available: number; peak: number; minReserve: number; secondaryFuel: number }> = {};
    for (const rows of Object.values(data)) {
      for (const row of rows) {
        installed += Number(row.installedCapacity) || 0;
        available += Number(row.availableCapacity) || 0;
        peak += Number(row.peakCapacity) || 0;
        minReserve += Number(row.minReserveCapacity) || 0;
        secondaryFuel += Number(row.secondaryFuelPeakCapacity) || 0;
        const s = row.status;
        if (!byStatus[s]) byStatus[s] = { count: 0, installed: 0, available: 0, peak: 0, minReserve: 0, secondaryFuel: 0 };
        byStatus[s].count += 1;
        byStatus[s].installed += Number(row.installedCapacity) || 0;
        byStatus[s].available += Number(row.availableCapacity) || 0;
        byStatus[s].peak += Number(row.peakCapacity) || 0;
        byStatus[s].minReserve += Number(row.minReserveCapacity) || 0;
        byStatus[s].secondaryFuel += Number(row.secondaryFuelPeakCapacity) || 0;
      }
    }
    return { installed, available, peak, minReserve, secondaryFuel, degradation: installed - available, byStatus };
  }, [data]);

  return (
    <div className="space-y-3">
    <div className="rounded-2xl bg-white border border-slate-200 shadow-xl ring-1 ring-slate-900/5 overflow-hidden">
      {title && (
        <div className="px-5 py-4 bg-orange-500 flex items-center justify-between" dir="rtl">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-white" />
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing((v) => !v)}
              className="gap-1.5 bg-white text-orange-600 border-white hover:bg-orange-50 hover:text-orange-700"
            >
              {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {editing ? "סיום עריכה" : "ערוך טבלה"}
            </Button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-base" dir="rtl">
          <thead>
            <tr className="bg-white border-b-2 border-slate-400">
              {COL_HEADERS.map((h) => (
                <th
                  key={h.label}
                  className="px-2 py-3 text-center text-xs font-bold text-orange-600 min-w-[56px]"
                >
                  {h.label}
                  {h.sub && (
                    <div className="font-semibold text-orange-500/80 mt-0.5">{h.sub}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const rows = data[group];
              const rowCount = rows.length + (editing ? 1 : 0);
              return rows.map((row, rowIdx) => (
                <tr
                  key={`${group}-${row.stationNumber}`}
                  className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors  ${
                    rowIdx === rows.length - 1 && !editing ? "border-b-2 border-b-slate-400" : ""
                  }`}
                >
                  {/* שם יחידה — merged, read-only */}
                  {rowIdx === 0 && (
                    <td
                      rowSpan={rowCount}
                      className="px-4 py-3 text-center align-middle font-semibold text-slate-800 bg-slate-50/60 border-l border-slate-200 whitespace-nowrap"
                    >
                      {group}
                    </td>
                  )}

                  {/* מספר יחידה — read-only */}
                  <td className="px-4 py-2 text-center font-medium text-slate-700">
                    {row.stationNumber}
                  </td>
                  {/* יכולת מותקנת */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-700">{row.installedCapacity}</span>
                    ) : row.stationId ? (
                      // Catalog-sourced row: value is locked. Edit in /settings/stations.
                      <span
                        className="inline-flex items-center gap-1 px-2 text-slate-700"
                        title="ערך זה מגיע מהקטלוג ונערך בעמוד ההגדרות"
                      >
                        <Lock className="h-3 w-3 text-slate-400" />
                        {row.installedCapacity}
                      </span>
                    ) : (
                      <FieldText
                        type="number"
                        value={row.installedCapacity}
                        onChange={(e) =>
                          updateRow(group, rowIdx, {
                            installedCapacity: Number(e.target.value),
                          })
                        }
                        className="h-9 w-28 text-center px-1"
                      />
                    )}
                  </td>

                  {/* יכולת זמינה כעת */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-700">{row.availableCapacity}</span>
                    ) : (
                      <FieldText
                        type="number"
                        value={row.availableCapacity}
                        onChange={(e) =>
                          updateRow(group, rowIdx, {
                            availableCapacity: Number(e.target.value),
                          })
                        }
                        className="h-9 w-28 text-center px-1"
                      />
                    )}
                  </td>

                  {/* יכולת לשעת פסגה */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-700">{row.peakCapacity}</span>
                    ) : (
                      <FieldText
                        type="number"
                        value={row.peakCapacity}
                        onChange={(e) =>
                          updateRow(group, rowIdx, {
                            peakCapacity: Number(e.target.value),
                          })
                        }
                        className="h-9 w-28 text-center px-1"
                      />
                    )}
                  </td>

                  {/* יכולת לשעת מינימום רזרבה */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-700">{row.minReserveCapacity}</span>
                    ) : (
                      <FieldText
                        type="number"
                        value={row.minReserveCapacity}
                        onChange={(e) =>
                          updateRow(group, rowIdx, {
                            minReserveCapacity: Number(e.target.value),
                          })
                        }
                        className="h-9 w-28 text-center px-1"
                      />
                    )}
                  </td>

                  {/* יכולת זמינה בפסגה בדלק משני */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-700">{row.secondaryFuelPeakCapacity}</span>
                    ) : (
                      <FieldText
                        type="number"
                        value={row.secondaryFuelPeakCapacity}
                        onChange={(e) =>
                          updateRow(group, rowIdx, {
                            secondaryFuelPeakCapacity: Number(e.target.value),
                          })
                        }
                        className="h-9 w-28 text-center px-1"
                      />
                    )}
                  </td>

                  {/* התדרדרות ביכולת (computed: מותקנת - זמינה) */}
                  <td className="px-2 py-2 text-center">
                    <span className="px-2 text-slate-700">
                      {(Number(row.installedCapacity) || 0) - (Number(row.availableCapacity) || 0)}
                    </span>
                  </td>

                  {/* סטטוס */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${colorFor(row.status)}`}
                      >
                        {labelFor(row.status)}
                      </span>
                    ) : (
                      <FieldSelect
                        options={statusOptions}
                        bgColor={`${colorFor(row.status)}`}
                        value={row.status}
                        onValueChange={(val) =>
                          updateRow(group, rowIdx, { status: val as StationStatus })
                        }
                        className={`w-28 `}
                      />
                    )}
                  </td>

                  {/* זמן התחלה */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-500">{formatDateTime(row.startTime)}</span>
                    ) : (
                      <FieldDatePicker
                        showTime
                        value={row.startTime ? new Date(row.startTime) : undefined}
                        onChange={(d) =>
                          updateRow(group, rowIdx, {
                            startTime: d?.toISOString(),
                          })
                        }
                        className="w-40"
                      />
                    )}
                  </td>

                  {/* זמן סיום */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-500">{formatDateTime(row.endTime)}</span>
                    ) : (
                      <FieldDatePicker
                        showTime
                        value={row.endTime ? new Date(row.endTime) : undefined}
                        onChange={(d) =>
                          updateRow(group, rowIdx, {
                            endTime: d?.toISOString(),
                          })
                        }
                        className="w-40"
                      />
                    )}
                  </td>

                  {/* זמן סיום מעודכן */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-500">{formatDateTime(row.updatedEndTime)}</span>
                    ) : (
                      <FieldDatePicker
                        showTime
                        value={row.updatedEndTime ? new Date(row.updatedEndTime) : undefined}
                        onChange={(d) =>
                          updateRow(group, rowIdx, {
                            updatedEndTime: d?.toISOString(),
                          })
                        }
                        className="w-40"
                      />
                    )}
                  </td>

                  {/* הערות */}
                  <td className="px-2 py-2 text-center">
                    {readOnly ? (
                      <span className="px-2 text-slate-500">{row.notes ?? "—"}</span>
                    ) : (
                      <FieldText
                        type="text"
                        value={row.notes ?? ""}
                        onChange={(e) =>
                          updateRow(group, rowIdx, { notes: e.target.value })
                        }
                        className="h-9 w-56 text-center"
                        placeholder="הערות..."
                      />
                    )}
                  </td>
                </tr>
              )).concat(
                editing
                  ? [
                      <tr key={`${group}-add`} className="border-b-2 border-b-slate-400">
                        <td colSpan={COL_HEADERS.length - 1} className="px-4 py-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addRow(group)}
                            className="gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Plus className="h-4 w-4" />
                            הוסף שורה
                          </Button>
                        </td>
                      </tr>,
                    ]
                  : []
              );
            })}
          </tbody>

        </table>
      </div>

      {/* ── Status breakdown panel ── */}
      {(() => {
        const STATUS_ORDER = ["Active", "Maintenance", "Inactive"] as const;
        const empty = { count: 0, installed: 0, available: 0, peak: 0, minReserve: 0, secondaryFuel: 0 };
        const totalCount = Object.values(totals.byStatus).reduce((n, s) => n + s.count, 0);
        return (
          <div className="border-t border-slate-200 bg-white px-5 py-5" dir="rtl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">פירוט לפי סטטוס</p>
            <div className="flex flex-wrap gap-6">
              {/* ── Total card ── */}
              <div className="bg-orange-50 rounded-xl border border-orange-200 shadow-sm px-5 py-4 flex flex-col gap-3 min-w-[240px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-block px-3 py-0.5 rounded-full text-sm font-semibold border bg-orange-500 text-white border-orange-500">סה״כ</span>
                  <span className="text-sm text-slate-500 font-semibold">{totalCount} יחידות</span>
                </div>
                <div className="h-px bg-orange-100" />
                <div className="grid grid-cols-4 gap-x-3 text-center">
                  <div className="text-xs text-slate-400 font-medium">מותקנת</div>
                  <div className="text-xs text-slate-400 font-medium">זמינה</div>
                  <div className="text-xs text-slate-400 font-medium">מינ׳ רזרבה</div>
                  <div className="text-xs text-slate-400 font-medium">התדרדרות</div>
                  <div className="text-lg text-orange-900 font-bold mt-1">{totals.installed}</div>
                  <div className="text-lg text-orange-900 font-bold mt-1">{totals.available}</div>
                  <div className="text-lg text-orange-900 font-bold mt-1">{totals.minReserve}</div>
                  <div className="text-lg text-orange-900 font-bold mt-1">{totals.degradation}</div>
                </div>
              </div>
              {/* ── Per-status cards ── */}
              {STATUS_ORDER.map((status) => {
                const s = totals.byStatus[status] ?? empty;
                const valueColor =
                  status === "Active"
                    ? "text-emerald-600"
                    : status === "Maintenance"
                    ? "text-amber-500"
                    : "text-red-500";
                return (
                  <div
                    key={`card-${status}`}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-3 min-w-[240px]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-sm font-semibold border ${colorFor(status)}`}
                      >
                        {labelFor(status)}
                      </span>
                      <span className="text-sm text-slate-500 font-semibold">{s.count} יחידות</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="grid grid-cols-4 gap-x-3 text-center">
                      <div className="text-xs text-slate-400 font-medium">מותקנת</div>
                      <div className="text-xs text-slate-400 font-medium">זמינה</div>
                      <div className="text-xs text-slate-400 font-medium">מינ׳ רזרבה</div>
                      <div className="text-xs text-slate-400 font-medium">התדרדרות</div>
                      <div className={`text-lg ${valueColor} font-bold mt-1`}>{s.installed}</div>
                      <div className={`text-lg ${valueColor} font-bold mt-1`}>{s.available}</div>
                      <div className={`text-lg ${valueColor} font-bold mt-1`}>{s.minReserve}</div>
                      <div className={`text-lg ${valueColor} font-bold mt-1`}>{s.installed - s.available}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Add station group ── */}
      {editing && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2 flex-wrap" dir="rtl">
          <FieldText
            type="text"
            value={newStationName}
            onChange={(e) => setNewStationName(e.target.value)}
            placeholder="שם תחנה חדשה..."
            className="h-9 w-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newStationName.trim()) {
                addStation(newStationName);
                setNewStationName("");
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (newStationName.trim()) {
                addStation(newStationName);
                setNewStationName("");
              }
            }}
            disabled={!newStationName.trim()}
            className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Plus className="h-4 w-4" />
            הוסף תחנה
          </Button>

          {/* Catalog-sourced shortcut: pre-fills capacity & fuels and locks them. */}
          <div className="mx-2 h-6 w-px bg-slate-200" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <BookOpen className="h-4 w-4" />
            הוסף מקטלוג
          </Button>
        </div>
      )}
    </div>

    <CatalogPickerDialog
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      existingStationTags={Object.keys(data)}
      onPick={(station, unit) => {
        addFromCatalog(
          station.name,
          station.id ?? station._id ?? "",
          {
            id: unit.id,
            _id: unit._id,
            tag: unit.tag,
            installedCapacity: unit.installedCapacity,
            mainFuel: unit.mainFuel,
            secondaryFuels: unit.secondaryFuels ?? [],
          },
        );
      }}
    />

    </div>
  );
}
