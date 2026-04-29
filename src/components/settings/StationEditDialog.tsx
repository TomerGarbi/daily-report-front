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
  type UnitPayload,
  type CreateStationPayload,
  type UpdateStationPayload,
} from "@/types/station";

const TYPE_OPTIONS = STATION_TYPES.map((t) => ({
  value: t,
  label: STATION_TYPE_LABELS[t],
}));

const FUEL_OPTIONS = STATION_FUELS.map((f) => ({
  value: f,
  label: STATION_FUEL_LABELS[f],
}));

interface DraftUnit {
  /** Existing unit id, if this row originated from the server. */
  _id?: string;
  tag: string;
  installedCapacity: number | "";
  mainFuel: string;
  /** Comma-separated string while editing; split on save. */
  secondaryFuels: string;
}

function unitsToDrafts(units: Unit[] | undefined): DraftUnit[] {
  return (units ?? []).map((u) => ({
    _id: u._id ?? u.id,
    tag: u.tag,
    installedCapacity: u.installedCapacity,
    mainFuel: u.mainFuel,
    secondaryFuels: (u.secondaryFuels ?? []).join(", "),
  }));
}

function draftToPayload(d: DraftUnit): UnitPayload {
  return {
    tag: d.tag.trim(),
    installedCapacity: typeof d.installedCapacity === "number" ? d.installedCapacity : 0,
    mainFuel: d.mainFuel.trim(),
    secondaryFuels: d.secondaryFuels
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

interface StationEditDialogProps {
  /** When `null` the dialog is in create mode. */
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateStationPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateStationPayload) => Promise<void>;
  saving?: boolean;
}

export function StationEditDialog({
  station,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  saving = false,
}: StationEditDialogProps) {
  const isEdit = !!station;

  const [name, setName]   = useState("");
  const [tag, setTag]     = useState("");
  const [type, setType]   = useState<StationType>("iec");
  const [fuel, setFuel]   = useState<StationFuel>("gas");
  const [units, setUnits] = useState<DraftUnit[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reset local state every time the dialog opens for a different record.
  useEffect(() => {
    if (open) {
      setName(station?.name ?? "");
      setTag(station?.tag ?? "");
      setType(station?.type ?? "iec");
      setFuel(station?.fuel ?? "gas");
      setUnits(unitsToDrafts(station?.units));
      setError(null);
    }
  }, [open, station]);

  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      { tag: "", installedCapacity: "", mainFuel: "", secondaryFuels: "" },
    ]);
  };

  const updateUnit = (idx: number, patch: Partial<DraftUnit>) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, ...patch } : u)));
  };

  const removeUnit = (idx: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setError(null);

    // Top-level validation — server will repeat these checks but a fast
    // client-side filter avoids round-trips for obvious mistakes.
    if (!name.trim()) return setError("יש להזין שם תחנה");
    if (!tag.trim())  return setError("יש להזין תג תחנה");

    for (const [i, u] of units.entries()) {
      if (!u.tag.trim())                      return setError(`יחידה #${i + 1}: חסר תג`);
      if (u.installedCapacity === "" || u.installedCapacity < 0)
                                              return setError(`יחידה #${i + 1}: יכולת מותקנת לא תקינה`);
      if (!u.mainFuel.trim())                 return setError(`יחידה #${i + 1}: חסר דלק עיקרי`);
    }

    try {
      const unitsPayload = units.map(draftToPayload);
      if (isEdit && station) {
        await onUpdate(station.id ?? station._id ?? "", {
          name:  name.trim(),
          tag:   tag.trim(),
          type,
          fuel,
          units: unitsPayload,
        });
      } else {
        await onCreate({
          name:  name.trim(),
          tag:   tag.trim(),
          type,
          fuel,
          units: unitsPayload,
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
              label="דלק / טכנולוגיה"
              value={fuel}
              onValueChange={(v) => setFuel(v as StationFuel)}
              options={FUEL_OPTIONS}
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
              <div className="space-y-3">
                {units.map((u, idx) => (
                  <div
                    key={u._id ?? `new-${idx}`}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-slate-50/60 p-3 rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <FieldText
                        label="תג"
                        value={u.tag}
                        onChange={(e) => updateUnit(idx, { tag: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <FieldText
                        label="יכולת מותקנת (MW)"
                        type="number"
                        value={u.installedCapacity}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateUnit(idx, { installedCapacity: v === "" ? "" : Number(v) });
                        }}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <FieldText
                        label="דלק עיקרי"
                        value={u.mainFuel}
                        onChange={(e) => updateUnit(idx, { mainFuel: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <FieldText
                        label="דלקים משניים (מופרדים בפסיק)"
                        value={u.secondaryFuels}
                        onChange={(e) => updateUnit(idx, { secondaryFuels: e.target.value })}
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
