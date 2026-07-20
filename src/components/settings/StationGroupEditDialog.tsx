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
import { X } from "lucide-react";
import { STATION_TYPES, STATION_TYPE_LABELS, type StationType } from "@/types/station";
import type {
  StationGroup,
  CreateStationGroupPayload,
  UpdateStationGroupPayload,
} from "@/types/stationGroup";

const TYPE_OPTIONS = STATION_TYPES.map((t) => ({
  value: t,
  label: STATION_TYPE_LABELS[t],
}));

interface StationGroupEditDialogProps {
  /** When `null` the dialog is in create mode. */
  group: StationGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateStationGroupPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateStationGroupPayload) => Promise<void>;
  saving?: boolean;
}

export function StationGroupEditDialog({
  group,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  saving = false,
}: StationGroupEditDialogProps) {
  const isEdit = !!group;

  const [name, setName]               = useState("");
  const [tag, setTag]                 = useState("");
  const [type, setType]               = useState<StationType>("iec");
  const [order, setOrder]             = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(group?.name ?? "");
      setTag(group?.tag ?? "");
      setType(group?.type ?? "iec");
      setOrder(group?.order ?? "");
      setDescription(group?.description ?? "");
      setError(null);
    }
  }, [open, group]);

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) return setError("יש להזין שם קבוצה");
    if (!tag.trim())  return setError("יש להזין תג קבוצה");
    // Server also validates this — fast client check to avoid a round-trip.
    if (!/^[a-z0-9][a-z0-9-]*$/.test(tag.trim())) {
      return setError("תג קבוצה חייב להיות באנגלית קטנה, ספרות ומקפים בלבד");
    }

    const payload: CreateStationGroupPayload = {
      name:        name.trim(),
      tag:         tag.trim(),
      type,
      order:       typeof order === "number" ? order : 0,
      description: description.trim() || undefined,
    };

    try {
      if (isEdit && group) {
        await onUpdate(group.id ?? group._id ?? "", payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? `עריכת קבוצה — ${group?.name}` : "הוספת קבוצה חדשה"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldText
              label="שם קבוצה"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FieldText
              label="תג"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              required
              placeholder="לדוגמה: iec-gas"
            />
            <FieldSelect
              label="סוג בעלות"
              value={type}
              onValueChange={(v) => setType(v as StationType)}
              options={TYPE_OPTIONS}
            />
            <FieldText
              label="סדר תצוגה"
              type="number"
              value={order}
              onChange={(e) => {
                const v = e.target.value;
                setOrder(v === "" ? "" : Number(v));
              }}
              placeholder="0"
            />
          </div>

          <FieldText
            label="תיאור (אופציונלי)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

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
            {saving ? "שומר…" : isEdit ? "שמור שינויים" : "צור קבוצה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
