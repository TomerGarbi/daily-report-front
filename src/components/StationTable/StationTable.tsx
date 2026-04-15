"use client";

import { useCallback, useMemo } from "react";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { FieldDatePicker } from "@/components/inputs/FieldDatePicker";
import type { SelectOption } from "@/components/inputs/FieldSelect";
import { AlertTriangle } from "lucide-react";
import type { StationRow, StationData } from "@/types/report";

export type { StationRow, StationData };

interface StationTableProps {
  data: StationData;
  onChange?: (data: StationData) => void;
  title?: string;
  readOnly?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
      return "bg-slate-100 text-slate-600 border-slate-200";
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

  const groups = Object.keys(data);

  const totals = useMemo(() => {
    let installed = 0;
    let available = 0;
    let peak = 0;
    let minReserve = 0;
    let secondaryFuel = 0;
    for (const rows of Object.values(data)) {
      for (const row of rows) {
        installed += Number(row.installedCapacity) || 0;
        available += Number(row.availableCapacity) || 0;
        peak += Number(row.peakCapacity) || 0;
        minReserve += Number(row.minReserveCapacity) || 0;
        secondaryFuel += Number(row.secondaryFuelPeakCapacity) || 0;
      }
    }
    return { installed, available, peak, minReserve, secondaryFuel, degradation: installed - available };
  }, [data]);

  return (
    <div className="space-y-3">
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-200" dir="rtl">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-base" dir="rtl">
          <thead>
            <tr className="bg-orange-500">
              {COL_HEADERS.map((h) => (
                <th
                  key={h.label}
                  className="px-2 py-2 text-center text-xs font-semibold text-white min-w-[56px]"
                >
                  {h.label}
                  {h.sub && (
                    <div className="font-semibold opacity-90 mt-0.5">{h.sub}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const rows = data[group];
              return rows.map((row, rowIdx) => (
                <tr
                  key={`${group}-${row.stationNumber}`}
                  className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                    rowIdx === rows.length - 1 ? "border-b-slate-200" : ""
                  }`}
                >
                  {/* שם יחידה — merged, read-only */}
                  {rowIdx === 0 && (
                    <td
                      rowSpan={rows.length}
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
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColor(row.status)}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    ) : (
                      <FieldSelect
                        options={STATUS_OPTIONS}
                        value={row.status}
                        onValueChange={(val) =>
                          updateRow(group, rowIdx, { status: val })
                        }
                        className="w-28"
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
              ));
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-orange-300 font-bold" style={{ backgroundColor: "#FFEDD5", color: "#C2410C" }}>
              <td colSpan={2} className="px-4 py-2 text-center text-sm">סה״כ</td>
              <td className="px-2 py-2 text-center text-sm">{totals.installed}</td>
              <td className="px-2 py-2 text-center text-sm">{totals.available}</td>
              <td className="px-2 py-2 text-center text-sm">{totals.peak}</td>
              <td className="px-2 py-2 text-center text-sm">{totals.minReserve}</td>
              <td className="px-2 py-2 text-center text-sm">{totals.secondaryFuel}</td>
              <td className="px-2 py-2 text-center text-sm">{totals.degradation}</td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    </div>
  );
}
