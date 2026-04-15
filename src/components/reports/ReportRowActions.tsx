"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ReportRowActionsProps {
  reportId: string;
  reportAuthor?: string;
  onDelete?: (reportId: string) => void;
}

export function ReportRowActions({ reportId, reportAuthor, onDelete }: ReportRowActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const canEdit =
    user?.role === "manager" ||
    user?.role === "admin" ||
    user?.username === reportAuthor;

  const canDelete =
    user?.role === "admin" ||
    (user?.groups ?? []).includes("Reports-Admin");

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
        onClick={() => router.push(`/reports/${reportId}`)}
        title="צפה"
      >
        <Eye className="h-4 w-4" />
      </Button>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-amber-400 hover:text-amber-600 hover:bg-amber-50"
          onClick={() => router.push(`/reports/${reportId}/edit`)}
          title="ערוך"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
              title="מחק"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>מחיקת דוח</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את הדוח לצמיתות ולא ניתן לשחזר אותו. האם להמשיך?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => onDelete?.(reportId)}
              >
                מחק
              </AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
