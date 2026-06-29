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
import { STATION_FUEL_LABELS } from "@/types/station";
import type { FuelSite } from "@/types/fuelSite";
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

interface FuelSitesTableProps {
  sites: FuelSite[];
  isLoading: boolean;
  error?: string | null;
  canManage: boolean;
  onEdit: (site: FuelSite) => void;
  onDelete: (site: FuelSite) => Promise<void>;
}

export function FuelSitesTable({
  sites,
  isLoading,
  error,
  canManage,
  onEdit,
  onDelete,
}: FuelSitesTableProps) {
  const [pendingDelete, setPendingDelete] = useState<FuelSite | null>(null);
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
              <TableHead className="text-right font-semibold text-white">סוגי דלק</TableHead>
              <TableHead className="text-right font-semibold text-white">מספר מיכלים</TableHead>
              <TableHead className="text-right font-semibold text-white">קיבולת כוללת</TableHead>
              {canManage && (
                <TableHead className="text-right font-semibold text-white">פעולות</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-16">
                  <Spinner size="md" label="טוען אתרי דלק…" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-16 text-center text-rose-500">
                  שגיאה בטעינת אתרי הדלק
                </TableCell>
              </TableRow>
            ) : sites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-16 text-center text-muted-foreground">
                  לא נמצאו אתרי דלק
                </TableCell>
              </TableRow>
            ) : (
              sites.map((s, idx) => {
                const totalCapacity = (s.tanks ?? []).reduce(
                  (sum, t) => sum + (Number(t.capacity) || 0),
                  0,
                );
                const fuelLabels = (s.fuelTypes ?? [])
                  .map((f) => STATION_FUEL_LABELS[f] ?? f)
                  .join(", ");
                return (
                  <TableRow
                    key={s.id ?? s._id}
                    className={`transition-colors ${idx % 2 === 0 ? "bg-white hover:bg-orange-50" : "bg-orange-100 hover:bg-orange-200"}`}
                  >
                    <TableCell className="font-medium text-slate-800">{s.name}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">{s.tag}</TableCell>
                    <TableCell className="text-slate-600">{fuelLabels || "—"}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">{s.tanks?.length ?? 0}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">
                      {totalCapacity > 0 ? totalCapacity.toLocaleString("he-IL") : "—"}
                    </TableCell>
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
            <AlertDialogTitle>למחוק את אתר הדלק?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את אתר הדלק &quot;{pendingDelete?.name}&quot; ואת כל המיכלים שלו. לא ניתן לבטל.
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
