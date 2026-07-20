"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { Plus, Trash2, X } from "lucide-react";
import {
  STATION_TYPES,
  STATION_TYPE_LABELS,
  STATION_FUELS,
  STATION_FUEL_LABELS,
  type Station,
  type StationType,
  type StationFuel,
  type Unit,
  type FuelCapacity,
  type UnitPayload,
  type CreateStationPayload,
  type UpdateStationPayload,
} from "@/types/station";
import type { StationGroup } from "@/types/stationGroup";

const TYPE_OPTIONS = STATION_TYPES.map((t) => ({
  value: t,
  label: STATION_TYPE_LABELS[t],
}));

const FUEL_OPTIONS = STATION_FUELS.map((f) => ({
  value: f,
  label: STATION_FUEL_LABELS[f],
}));

// ─── Draft types (allow empty strings while editing) ────────────────────────

interface DraftFuel {
  type: StationFuel;
  capacity: number | "";
}

interface DraftUnit {
  /** Existing unit id, if this row originated from the server. */
  _id?: string;
  number: number | "";
  mainFuel: DraftFuel;
  secondaryFuels: DraftFuel[];
}

function fuelToDraft(f: FuelCapacity | undefined, fallbackType: StationFuel): DraftFuel {
  return {
    type: f?.type ?? fallbackType,
    capacity: f?.capacity ?? "",
  };
}

function unitsToDrafts(units: Unit[] | undefined): DraftUnit[] {
  return (units ?? []).map((u) => ({
    _id: u._id ?? u.id,
    number: u.number,
    mainFuel: fuelToDraft(u.mainFuel, "gas"),
    secondaryFuels: (u.secondaryFuels ?? []).map((f) => fuelToDraft(f, "gas")),
  }));
}

function draftFuelToPayload(d: DraftFuel): FuelCapacity {
  return {
    type: d.type,
    capacity: typeof d.capacity === "number" ? d.capacity : 0,
  };
}

function draftToPayload(d: DraftUnit): UnitPayload {
  return {
    number: typeof d.number === "number" ? d.number : 0,
    mainFuel: draftFuelToPayload(d.mainFuel),
    secondaryFuels: d.secondaryFuels.map(draftFuelToPayload),
  };
}

interface StationEditDialogProps {
  /** When `null` the dialog is in create mode. */
  station: Station | null;
  /** All available groups; the selector filters them by the current `type`. */
  groups: StationGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateStationPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateStationPayload) => Promise<void>;
  saving?: boolean;
}

export function StationEditDialog({
  station,
  groups,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  saving = false,
}: StationEditDialogProps) {
  const isEdit = !!station;

  const [name, setName]     = useState("");
  const [tag, setTag]       = useState("");
  const [type, setType]     = useState<StationType>("iec");
  const [groupId, setGroupId] = useState<string>("__none");
  const [units, setUnits]   = useState<DraftUnit[]>([]);
  const [error, setError]   = useState<string | null>(null);

  // Reset local state every time the dialog opens for a different record.
  useEffect(() => {
    if (open) {
      setName(station?.name ?? "");
      setTag(station?.tag ?? "");
      setType(station?.type ?? "iec");
      setGroupId(station?.groupId ?? "__none");
      setUnits(unitsToDrafts(station?.units));
      setError(null);
    }
  }, [open, station]);

  // Whenever the ownership type changes clear an incompatible group.
  useEffect(() => {
    if (groupId === "__none") return;
    const g = groups.find((x) => (x.id ?? x._id) === groupId);
    if (g && g.type !== type) setGroupId("__none");
  }, [type, groupId, groups]);

  // Group options filtered by the currently selected ownership type.
  const groupOptions = [
    { value: "__none", label: "— ללא קבוצה —" },
    ...groups
      .filter((g) => g.type === type)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "he"))
      .map((g) => ({ value: (g.id ?? g._id) as string, label: g.name })),
  ];

  const addUnit = () => {
    setUnits((prev) => {
      const nextNumber = prev.reduce(
        (max, u) => Math.max(max, typeof u.number === "number" ? u.number : 0),
        0,
      ) + 1;
      return [
        ...prev,
        {
          number: nextNumber,
          mainFuel: { type: "gas", capacity: "" },
          secondaryFuels: [],
        },
      ];
    });
  };

  const updateUnit = (idx: number, patch: Partial<DraftUnit>) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, ...patch } : u)));
  };

  const removeUnit = (idx: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMainFuel = (idx: number, patch: Partial<DraftFuel>) => {
    setUnits((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, mainFuel: { ...u.mainFuel, ...patch } } : u)),
    );
  };

  const addSecondaryFuel = (idx: number) => {
    setUnits((prev) =>
      prev.map((u, i) =>
        i === idx
          ? { ...u, secondaryFuels: [...u.secondaryFuels, { type: "diesel", capacity: "" }] }
          : u,
      ),
    );
  };

  const updateSecondaryFuel = (idx: number, sIdx: number, patch: Partial<DraftFuel>) => {
    setUnits((prev) =>
      prev.map((u, i) =>
        i === idx
          ? {
              ...u,
              secondaryFuels: u.secondaryFuels.map((f, j) =>
                j === sIdx ? { ...f, ...patch } : f,
              ),
            }
          : u,
      ),
    );
  };

  const removeSecondaryFuel = (idx: number, sIdx: number) => {
    setUnits((prev) =>
      prev.map((u, i) =>
        i === idx
          ? { ...u, secondaryFuels: u.secondaryFuels.filter((_, j) => j !== sIdx) }
          : u,
      ),
    );
  };

  const handleSave = async () => {
    setError(null);

    // Top-level validation — server will repeat these checks but a fast
    // client-side filter avoids round-trips for obvious mistakes.
    if (!name.trim()) return setError("יש להזין שם תחנה");
    if (!tag.trim())  return setError("יש להזין תג תחנה");

    const seenNumbers = new Set<number>();
    for (const [i, u] of units.entries()) {
      if (u.number === "" || u.number < 1) {
        return setError(`יחידה #${i + 1}: מספר יחידה חייב להיות מספר שלם חיובי`);
      }
      if (seenNumbers.has(u.number)) {
        return setError(`יחידה #${i + 1}: מספר יחידה "${u.number}" מופיע יותר מפעם אחת`);
      }
      seenNumbers.add(u.number);

      if (u.mainFuel.capacity === "" || u.mainFuel.capacity < 0) {
        return setError(`יחידה #${i + 1}: יכולת בדלק העיקרי לא תקינה`);
      }
      for (const [j, f] of u.secondaryFuels.entries()) {
        if (f.capacity === "" || f.capacity < 0) {
          return setError(`יחידה #${i + 1} — דלק משני #${j + 1}: יכולת לא תקינה`);
        }
      }
    }

    try {
      const unitsPayload = units.map(draftToPayload);
      if (isEdit && station) {
        await onUpdate(station.id ?? station._id ?? "", {
          name:    name.trim(),
          tag:     tag.trim(),
          type,
          groupId: groupId === "__none" ? null : groupId,
          units:   unitsPayload,
        });
      } else {
        await onCreate({
          name:    name.trim(),
          tag:     tag.trim(),
          type,
          groupId: groupId === "__none" ? null : groupId,
          units:   unitsPayload,
        });
      }
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? `עריכת תחנה — ${station?.name}` : "הוספת תחנה חדשה"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FieldText
              label="שם תחנה"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FieldText
              label="תג"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              required
            />
            <FieldSelect
              label="סוג בעלות"
              value={type}
              onValueChange={(v) => setType(v as StationType)}
              options={TYPE_OPTIONS}
            />
            <FieldSelect
              label="קבוצה"
              value={groupId}
              onValueChange={setGroupId}
              options={groupOptions}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-700">יחידות</h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addUnit}
                className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4" />
                הוסף יחידה
              </Button>
            </div>

            {units.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין יחידות. לחץ "הוסף יחידה" כדי להוסיף יחידה ראשונה.
              </p>
            ) : (
              <div className="space-y-4">
                {units.map((u, idx) => (
                  <div
                    key={u._id ?? `new-${idx}`}
                    className="bg-slate-50/60 border border-slate-200 p-3 rounded-lg space-y-3"
                  >
                    {/* Header row: unit number + main fuel */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                      <div className="md:col-span-2">
                        <FieldText
                          label="מספר יחידה"
                          type="number"
                          value={u.number}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateUnit(idx, { number: v === "" ? "" : Number(v) });
                          }}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <FieldSelect
                          label="דלק עיקרי"
                          value={u.mainFuel.type}
                          onValueChange={(v) => updateMainFuel(idx, { type: v as StationFuel })}
                          options={FUEL_OPTIONS}
                        />
                      </div>
                      <div className="md:col-span-5">
                        <FieldText
                          label="יכולת בדלק עיקרי (MW)"
                          type="number"
                          value={u.mainFuel.capacity}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateMainFuel(idx, { capacity: v === "" ? "" : Number(v) });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-end pt-6">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeUnit(idx)}
                          className="text-rose-500 hover:bg-rose-50"
                          aria-label="הסר יחידה"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Secondary fuels sub-list */}
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">דלקים משניים</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => addSecondaryFuel(idx)}
                          className="gap-1 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          הוסף דלק משני
                        </Button>
                      </div>

                      {u.secondaryFuels.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          אין דלקים משניים.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {u.secondaryFuels.map((f, sIdx) => (
                            <div
                              key={sIdx}
                              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
                            >
                              <div className="md:col-span-5">
                                <FieldSelect
                                  label={sIdx === 0 ? "דלק" : undefined}
                                  value={f.type}
                                  onValueChange={(v) =>
                                    updateSecondaryFuel(idx, sIdx, { type: v as StationFuel })
                                  }
                                  options={FUEL_OPTIONS}
                                />
                              </div>
                              <div className="md:col-span-6">
                                <FieldText
                                  label={sIdx === 0 ? "יכולת בדלק זה (MW)" : undefined}
                                  type="number"
                                  value={f.capacity}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    updateSecondaryFuel(idx, sIdx, {
                                      capacity: v === "" ? "" : Number(v),
                                    });
                                  }}
                                />
                              </div>
                              <div className={`md:col-span-1 flex items-end justify-end ${sIdx === 0 ? "pt-6" : ""}`}>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeSecondaryFuel(idx, sIdx)}
                                  className="text-rose-500 hover:bg-rose-50"
                                  aria-label="הסר דלק משני"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-4 w-4 me-1" />
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? "שומר…" : isEdit ? "שמור שינויים" : "צור תחנה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
