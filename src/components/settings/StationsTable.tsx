"use client";

import { useState } from "react";
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
import { STATION_TYPE_LABELS, STATION_FUEL_LABELS, type Station } from "@/types/station";
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
  isLoading: boolean;
  error?: string | null;
  canManage: boolean;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => Promise<void>;
}

export function StationsTable({
  stations,
  isLoading,
  error,
  canManage,
  onEdit,
  onDelete,
}: StationsTableProps) {
  const [pendingDelete, setPendingDelete] = useState<Station | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      <div className="rounded-2xl border border-orange-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-500 hover:bg-orange-500">
              <TableHead className="text-right font-semibold text-white">שם</TableHead>
              <TableHead className="text-right font-semibold text-white">תג</TableHead>
              <TableHead className="text-right font-semibold text-white">בעלות</TableHead>
              <TableHead className="text-right font-semibold text-white">דלק</TableHead>
              <TableHead className="text-right font-semibold text-white">יחידות</TableHead>
              <TableHead className="text-right font-semibold text-white">יכולת מותקנת כוללת</TableHead>
              {canManage && (
                <TableHead className="text-right font-semibold text-white">פעולות</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="py-16">
                  <Spinner size="md" label="טוען תחנות…" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="py-16 text-center text-rose-500">
                  שגיאה בטעינת התחנות
                </TableCell>
              </TableRow>
            ) : stations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="py-16 text-center text-muted-foreground">
                  לא נמצאו תחנות
                </TableCell>
              </TableRow>
            ) : (
              stations.map((s, idx) => {
                const totalCapacity = (s.units ?? []).reduce((sum, u) => sum + (Number(u.installedCapacity) || 0), 0);
                return (
                  <TableRow
                    key={s.id ?? s._id}
                    className={`transition-colors ${idx % 2 === 0 ? "bg-white hover:bg-orange-50" : "bg-orange-100 hover:bg-orange-200"}`}
                  >
                    <TableCell className="font-medium text-slate-800">{s.name}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">{s.tag}</TableCell>
                    <TableCell className="text-slate-600">{STATION_TYPE_LABELS[s.type]}</TableCell>
                    <TableCell className="text-slate-600">{STATION_FUEL_LABELS[s.fuel]}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">{s.units?.length ?? 0}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">{totalCapacity} MW</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onEdit(s)}
                            aria-label="ערוך"
                            className="text-orange-600 hover:bg-orange-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setPendingDelete(s)}
                            aria-label="מחק"
                            className="text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
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
