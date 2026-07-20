"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/Spinner";
import { Pencil, Trash2 } from "lucide-react";
import { STATION_TYPE_LABELS, STATION_FUEL_LABELS, getStationMainFuel, getStationTotalCapacity, type Station } from "@/types/station";
import type { StationGroup } from "@/types/stationGroup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StationsTableProps {
  stations: Station[];
  /** All available groups; used to resolve a station's group name by id. */
  groups: StationGroup[];
  isLoading: boolean;
  error?: string | null;
  canManage: boolean;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => Promise<void>;
}

export function StationsTable({
  stations,
  groups,
  isLoading,
  error,
  canManage,
  onEdit,
  onDelete,
}: StationsTableProps) {
  const tErrors = useTranslations("errors.sections");
  const [pendingDelete, setPendingDelete] = useState<Station | null>(null);
  const [deleting, setDeleting] = useState(false);

  const groupNameById = new Map<string, string>();
  for (const g of groups) {
    const id = g.id ?? g._id;
    if (id) groupNameById.set(id, g.name);
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">שם</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">תג</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">בעלות</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">קבוצה</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">דלק</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">יחידות</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">יכולת מותקנת</TableHead>
              {canManage && (
                <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">פעולות</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="py-16">
                  <Spinner size="md" label="טוען תחנות…" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="py-16 text-center text-rose-500">
                  {tErrors("stations")}
                </TableCell>
              </TableRow>
            ) : stations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="py-16 text-center text-slate-400">
                  לא נמצאו תחנות
                </TableCell>
              </TableRow>
            ) : (
              stations.map((s) => {
                const totalCapacity = getStationTotalCapacity(s.units);
                const mainFuel      = getStationMainFuel(s.units);
                return (
                  <TableRow
                    key={s.id ?? s._id}
                    className="group bg-white border-b border-slate-100 last:border-0 transition-all hover:bg-slate-50/70 hover:border-r-2 hover:border-r-orange-400"
                  >
                    <TableCell className="font-medium text-slate-800 py-3.5">{s.name}</TableCell>
                    <TableCell className="text-slate-500 tabular-nums text-sm py-3.5">{s.tag}</TableCell>
                    <TableCell className="text-slate-600 text-sm py-3.5">{STATION_TYPE_LABELS[s.type]}</TableCell>
                    <TableCell className="text-slate-600 text-sm py-3.5">
                      {s.groupId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-xs font-medium">
                          {groupNameById.get(s.groupId) ?? "—"}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm py-3.5">{mainFuel ? STATION_FUEL_LABELS[mainFuel] : "—"}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums text-sm py-3.5">{s.units?.length ?? 0}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums text-sm py-3.5">{totalCapacity} MW</TableCell>
                    {canManage && (
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onEdit(s)}
                            aria-label="ערוך"
                            className="h-7 w-7 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setPendingDelete(s)}
                            aria-label="מחק"
                            className="h-7 w-7 text-slate-500 hover:text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את התחנה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את התחנה "{pendingDelete?.name}" ואת כל היחידות שלה. לא ניתן לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {deleting ? "מוחק…" : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
