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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/Spinner";
import { Pencil, Trash2 } from "lucide-react";
import type { UserEntry } from "@/types/user";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  admin: "מנהל",
  manager: "מנהל ביניים",
  user: "משתמש",
  guest: "אורח",
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 border-rose-200",
  manager: "bg-violet-100 text-violet-700 border-violet-200",
  user: "bg-emerald-100 text-emerald-700 border-emerald-200",
  guest: "bg-slate-100 text-slate-600 border-slate-200",
};

interface UserTableProps {
  users: UserEntry[];
  currentUsername?: string;
  isLoading: boolean;
  error?: string | null;
  onEdit?: (user: UserEntry) => void;
  onDelete?: (userId: string) => void;
}

export function UserTable({ users, currentUsername, isLoading, error, onEdit, onDelete }: UserTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<UserEntry | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700 hover:bg-slate-700">
              <TableHead className="text-right font-semibold text-white">שם משתמש</TableHead>
              <TableHead className="text-right font-semibold text-white w-28">תפקיד</TableHead>
              <TableHead className="text-right font-semibold text-white">קבוצות</TableHead>
              <TableHead className="text-right font-semibold text-white w-28">נוצר</TableHead>
              <TableHead className="text-right font-semibold text-white w-24">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16">
                  <Spinner size="md" label="טוען משתמשים…" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-rose-500">
                  שגיאה בטעינת המשתמשים
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  לא נמצאו משתמשים
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, idx) => {
                const isSelf = user.username === currentUsername;
                return (
                  <TableRow
                    key={user._id}
                    className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100"}
                  >
                    <TableCell className="font-medium text-slate-800">{user.username}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[user.role] ?? ROLE_STYLES.guest}`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {user.groups.length > 0
                        ? user.groups.map((g) => g.name).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm tabular-nums">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => onEdit?.(user)}
                          disabled={isSelf}
                          title={isSelf ? "לא ניתן לערוך את עצמך" : "עריכה"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-rose-600"
                          onClick={() => setDeleteTarget(user)}
                          disabled={isSelf}
                          title={isSelf ? "לא ניתן למחוק את עצמך" : "מחיקה"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת משתמש</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המשתמש{" "}
              <span className="font-semibold text-slate-800">{deleteTarget?.username}</span>?
              פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (deleteTarget) onDelete?.(deleteTarget._id);
                setDeleteTarget(null);
              }}
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
