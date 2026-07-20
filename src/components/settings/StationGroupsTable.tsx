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
import { STATION_TYPE_LABELS } from "@/types/station";
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

interface StationGroupsTableProps {
  groups: StationGroup[];
  isLoading: boolean;
  error?: string | null;
  canManage: boolean;
  onEdit: (group: StationGroup) => void;
  onDelete: (group: StationGroup) => Promise<void>;
}

export function StationGroupsTable({
  groups,
  isLoading,
  error,
  canManage,
  onEdit,
  onDelete,
}: StationGroupsTableProps) {
  const tErrors = useTranslations("errors.sections");
  const [pendingDelete, setPendingDelete] = useState<StationGroup | null>(null);
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">שם</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">תג</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">בעלות</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">סדר</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">תיאור</TableHead>
              {canManage && (
                <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">פעולות</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-16">
                  <Spinner size="md" label="טוען קבוצות…" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-16 text-center text-rose-500">
                  {tErrors("stations")}
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-16 text-center text-slate-400">
                  לא נמצאו קבוצות
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <TableRow
                  key={g.id ?? g._id}
                  className="group bg-white border-b border-slate-100 last:border-0 transition-all hover:bg-slate-50/70 hover:border-r-2 hover:border-r-orange-400"
                >
                  <TableCell className="font-medium text-slate-800 py-3.5">{g.name}</TableCell>
                  <TableCell className="text-slate-500 tabular-nums text-sm py-3.5">{g.tag}</TableCell>
                  <TableCell className="text-slate-600 text-sm py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                      {STATION_TYPE_LABELS[g.type]}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 tabular-nums text-sm py-3.5">{g.order ?? 0}</TableCell>
                  <TableCell className="text-slate-500 text-sm py-3.5 max-w-xs truncate">{g.description || "—"}</TableCell>
                  {canManage && (
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(g)}
                          aria-label="ערוך"
                          className="h-7 w-7 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setPendingDelete(g)}
                          aria-label="מחק"
                          className="h-7 w-7 text-slate-500 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את הקבוצה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הקבוצה &quot;{pendingDelete?.name}&quot;.
              לא ניתן למחוק קבוצה שעדיין מקושרות אליה תחנות — שייך את התחנות לקבוצה
              אחרת קודם. לא ניתן לבטל.
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
