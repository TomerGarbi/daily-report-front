"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { Spinner } from "@/components/Spinner";
import { useStations } from "@/hooks/useStations";
import {
  STATION_TYPES,
  STATION_TYPE_LABELS,
  STATION_FUELS,
  STATION_FUEL_LABELS,
  type Station,
  type StationType,
  type StationFuel,
  type Unit,
} from "@/types/station";

interface CatalogPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingStationTags?: string[];
  onPick: (station: Station, unit: Unit) => void;
}

export function CatalogPickerDialog({
  open,
  onOpenChange,
  existingStationTags,
  onPick,
}: CatalogPickerDialogProps) {
  const [typeFilter, setTypeFilter] = useState<StationType | "all">("all");
  const [fuelFilter, setFuelFilter] = useState<StationFuel | "all">("all");

  const { stations, isLoading, error } = useStations({
    type:  typeFilter  === "all" ? undefined : typeFilter,
    fuel:  fuelFilter  === "all" ? undefined : fuelFilter,
    limit: 200,
  });

  const [stationId, setStationId] = useState<string>("");
  const [unitId,    setUnitId]    = useState<string>("");

  // Reset selection every time the dialog re-opens.
  useEffect(() => {
    if (open) {
      setStationId("");
      setUnitId("");
      setTypeFilter("all");
      setFuelFilter("all");
    }
  }, [open]);

  const stationOptions = useMemo(
    () =>
      stations.map((s) => {
        const id = s.id ?? s._id ?? "";
        const tagSeen = existingStationTags?.includes(s.tag);
        return {
          value: id,
          label: tagSeen ? `${s.name} (${s.tag}) — קיימת בטבלה` : `${s.name} (${s.tag})`,
        };
      }),
    [stations, existingStationTags],
  );

  const selectedStation = useMemo(
    () => stations.find((s) => (s.id ?? s._id) === stationId) ?? null,
    [stations, stationId],
  );

  const unitOptions = useMemo(
    () =>
      (selectedStation?.units ?? []).map((u) => ({
        value: u.id ?? u._id ?? "",
        label: `#${u.number} — ${u.mainFuel.capacity} MW · ${STATION_FUEL_LABELS[u.mainFuel.type] ?? u.mainFuel.type}`,
      })),
    [selectedStation],
  );

  const selectedUnit = useMemo(
    () => (selectedStation?.units ?? []).find((u) => (u.id ?? u._id) === unitId) ?? null,
    [selectedStation, unitId],
  );

  const canConfirm = !!selectedStation && !!selectedUnit;

  const handleConfirm = () => {
    if (!selectedStation || !selectedUnit) return;
    onPick(selectedStation, selectedUnit);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>בחירת תחנה ויחידה מהקטלוג</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <FieldSelect
              label="בעלות"
              value={typeFilter}
              onValueChange={(v) => { setTypeFilter(v as StationType | "all"); setStationId(""); setUnitId(""); }}
              options={[
                { value: "all", label: "כל" },
                ...STATION_TYPES.map((t) => ({ value: t, label: STATION_TYPE_LABELS[t] })),
              ]}
            />
            <FieldSelect
              label="דלק / טכנולוגיה"
              value={fuelFilter}
              onValueChange={(v) => { setFuelFilter(v as StationFuel | "all"); setStationId(""); setUnitId(""); }}
              options={[
                { value: "all", label: "כל" },
                ...STATION_FUELS.map((f) => ({ value: f, label: STATION_FUEL_LABELS[f] })),
              ]}
            />
          </div>

          {error ? (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              שגיאה בטעינת הקטלוג: {error.message}
            </div>
          ) : isLoading ? (
            <div className="py-6">
              <Spinner size="md" label="טוען קטלוג…" className="mx-auto" />
            </div>
          ) : stations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              אין תחנות בקטלוג עבור סינון זה. הוסף תחנות בעמוד ההגדרות.
            </p>
          ) : (
            <>
              <FieldSelect
                label="תחנה"
                value={stationId}
                onValueChange={(v) => {
                  setStationId(v);
                  setUnitId("");
                }}
                options={stationOptions}
                placeholder="בחר תחנה…"
              />

              <FieldSelect
                label="יחידה"
                value={unitId}
                onValueChange={setUnitId}
                options={unitOptions}
                placeholder={
                  selectedStation
                    ? selectedStation.units.length === 0
                      ? "אין יחידות בתחנה זו"
                      : "בחר יחידה…"
                    : "בחר תחנה תחילה"
                }
                disabled={!selectedStation || selectedStation.units.length === 0}
              />

              {selectedUnit && (
                <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div><span className="font-semibold">מספר יחידה:</span> {selectedUnit.number}</div>
                  <div><span className="font-semibold">יכולת מותקנת (דלק עיקרי):</span> {selectedUnit.mainFuel.capacity} MW</div>
                  <div><span className="font-semibold">דלק עיקרי:</span> {STATION_FUEL_LABELS[selectedUnit.mainFuel.type] ?? selectedUnit.mainFuel.type}</div>
                  {selectedUnit.secondaryFuels?.length ? (
                    <div>
                      <span className="font-semibold">דלקים משניים:</span>{" "}
                      {selectedUnit.secondaryFuels
                        .map((f) => `${STATION_FUEL_LABELS[f.type] ?? f.type} (${f.capacity} MW)`)
                        .join(", ")}
                    </div>
                  ) : null}
                  <div className="text-muted-foreground pt-1">
                    שדות אלו יוגדרו כברירת-מחדל בשורה ולא ניתן יהיה לערוך אותם בדוח.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            הוסף שורה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
