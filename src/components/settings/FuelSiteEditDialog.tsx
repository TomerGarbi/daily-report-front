"use client";

import { useEffect, useMemo, useState } from "react";
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
import { FieldMultiSelect } from "@/components/inputs/FieldMultiSelect";
import { Plus, Trash2, X } from "lucide-react";
import {
  STATION_FUELS,
  STATION_FUEL_LABELS,
  type StationFuel,
} from "@/types/station";
import type {
  FuelSite,
  Tank,
  TankPayload,
  CreateFuelSitePayload,
  UpdateFuelSitePayload,
} from "@/types/fuelSite";

const FUEL_OPTIONS = STATION_FUELS.map((f) => ({
  value: f,
  label: STATION_FUEL_LABELS[f],
}));

interface DraftTank {
  _id?: string;
  name: string;
  fuelType: StationFuel | "";
  /** Empty string while user clears the input; coerced to number on save. */
  capacity: number | "";
}

function tanksToDrafts(tanks: Tank[] | undefined): DraftTank[] {
  return (tanks ?? []).map((t) => ({
    _id: t._id ?? t.id,
    name: t.name,
    fuelType: t.fuelType,
    capacity: t.capacity ?? "",
  }));
}

function draftToPayload(d: DraftTank): TankPayload {
  const payload: TankPayload = {
    name: d.name.trim(),
    fuelType: d.fuelType as StationFuel,
  };
  if (typeof d.capacity === "number") payload.capacity = d.capacity;
  return payload;
}

interface FuelSiteEditDialogProps {
  site: FuelSite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateFuelSitePayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateFuelSitePayload) => Promise<void>;
  saving?: boolean;
}

export function FuelSiteEditDialog({
  site,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  saving = false,
}: FuelSiteEditDialogProps) {
  const isEdit = !!site;

  const [name, setName]           = useState("");
  const [tag, setTag]             = useState("");
  const [fuelTypes, setFuelTypes] = useState<StationFuel[]>([]);
  const [tanks, setTanks]         = useState<DraftTank[]>([]);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(site?.name ?? "");
      setTag(site?.tag ?? "");
      setFuelTypes(site?.fuelTypes ?? []);
      setTanks(tanksToDrafts(site?.tanks));
      setError(null);
    }
  }, [open, site]);

  // Tank fuel options are constrained to the site's declared fuel types.
  const tankFuelOptions = useMemo(
    () =>
      fuelTypes.length > 0
        ? fuelTypes.map((f) => ({ value: f, label: STATION_FUEL_LABELS[f] }))
        : FUEL_OPTIONS,
    [fuelTypes],
  );

  const addTank = () => {
    setTanks((prev) => [
      ...prev,
      {
        name: "",
        fuelType: (fuelTypes[0] ?? "") as StationFuel | "",
        capacity: "",
      },
    ]);
  };

  const updateTank = (idx: number, patch: Partial<DraftTank>) => {
    setTanks((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const removeTank = (idx: number) => {
    setTanks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) return setError("יש להזין שם אתר");
    if (!tag.trim())  return setError("יש להזין תג אתר");
    if (fuelTypes.length === 0)
      return setError("יש לבחור לפחות סוג דלק אחד עבור האתר");

    for (const [i, t] of tanks.entries()) {
      if (!t.name.trim())                          return setError(`מיכל #${i + 1}: חסר שם`);
      if (!t.fuelType)                             return setError(`מיכל #${i + 1}: יש לבחור סוג דלק`);
      if (!fuelTypes.includes(t.fuelType as StationFuel))
        return setError(`מיכל #${i + 1}: סוג הדלק אינו מוגדר לאתר זה`);
      if (t.capacity !== "" && t.capacity < 0)     return setError(`מיכל #${i + 1}: קיבולת לא תקינה`);
    }

    try {
      const tanksPayload = tanks.map(draftToPayload);
      if (isEdit && site) {
        await onUpdate(site.id ?? site._id ?? "", {
          name:      name.trim(),
          tag:       tag.trim(),
          fuelTypes,
          tanks:     tanksPayload,
        });
      } else {
        await onCreate({
          name:      name.trim(),
          tag:       tag.trim(),
          fuelTypes,
          tanks:     tanksPayload,
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
            {isEdit ? `עריכת אתר דלק — ${site?.name}` : "הוספת אתר דלק חדש"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldText
              label="שם האתר"
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
            <FieldMultiSelect
              label="סוגי דלק"
              value={fuelTypes}
              onChange={(vals) => setFuelTypes(vals as StationFuel[])}
              options={FUEL_OPTIONS}
              placeholder="בחר סוגי דלק…"
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-700">מיכלים</h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addTank}
                disabled={fuelTypes.length === 0}
                className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4" />
                הוסף מיכל
              </Button>
            </div>

            {fuelTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                יש לבחור סוגי דלק לאתר לפני הוספת מיכלים.
              </p>
            ) : tanks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין מיכלים. לחץ &quot;הוסף מיכל&quot; כדי להוסיף מיכל ראשון.
              </p>
            ) : (
              <div className="space-y-3">
                {tanks.map((t, idx) => (
                  <div
                    key={t._id ?? `new-${idx}`}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-slate-50/60 p-3 rounded-lg"
                  >
                    <div className="md:col-span-4">
                      <FieldText
                        label="שם מיכל"
                        value={t.name}
                        onChange={(e) => updateTank(idx, { name: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <FieldSelect
                        label="סוג דלק"
                        value={t.fuelType}
                        onValueChange={(v) => updateTank(idx, { fuelType: v as StationFuel })}
                        options={tankFuelOptions}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <FieldText
                        label="קיבולת (אופציונלי)"
                        type="number"
                        value={t.capacity}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateTank(idx, { capacity: v === "" ? "" : Number(v) });
                        }}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end pt-6">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTank(idx)}
                        className="text-rose-500 hover:bg-rose-50"
                        aria-label="הסר מיכל"
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
            {saving ? "שומר…" : isEdit ? "שמור שינויים" : "צור אתר דלק"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
