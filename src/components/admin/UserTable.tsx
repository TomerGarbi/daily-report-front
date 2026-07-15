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
import { Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Info } from "lucide-react";
import type { UserEntry, UserSortField } from "@/types/user";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Human-friendly relative time. "לפני 3 דקות" / "היום 14:22" / "לפני 4 ימים".
 * Kept intentionally small — no dependency on date-fns for one call site.
 */
function formatRelative(iso: string | undefined): string {
  if (!iso) return "מעולם לא";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return "כרגע";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `לפני ${diffHr} שע'`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `לפני ${diffDay} ימ'`;
  return formatDate(iso);
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

// ── Status derivation ──────────────────────────────────────────────────────
// Matches the buckets computed by the backend `statsUserHandler`. Kept
// client-side too so the table can render a chip without a second round-trip.

type StatusKey = "activeNow" | "active" | "dormant" | "disabled" | "neverLoggedIn";

const STATUS_LABELS: Record<StatusKey, string> = {
  activeNow:     "מחובר עכשיו",
  active:        "פעיל",
  dormant:       "רדום",
  disabled:      "מושבת",
  neverLoggedIn: "לא התחבר",
};

const STATUS_STYLES: Record<StatusKey, string> = {
  activeNow:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  active:        "bg-blue-100 text-blue-700 border-blue-200",
  dormant:       "bg-amber-100 text-amber-700 border-amber-200",
  disabled:      "bg-slate-200 text-slate-700 border-slate-300",
  neverLoggedIn: "bg-slate-100 text-slate-500 border-slate-200",
};

/** Presence-dot boundary — matches the backend `activeNow` window. */
const ACTIVE_NOW_MS = 5 * 60 * 1000;
/** Dormant boundary — matches the backend 30-day cutoff. */
const DORMANT_MS = 30 * 24 * 60 * 60 * 1000;

function deriveStatus(user: UserEntry): StatusKey {
  if (user.disabled) return "disabled";
  if (!user.lastLoginAt && !user.lastActivityAt) return "neverLoggedIn";
  const activityMs = user.lastActivityAt ? Date.parse(user.lastActivityAt) : 0;
  const age = Date.now() - activityMs;
  if (age < ACTIVE_NOW_MS) return "activeNow";
  if (age < DORMANT_MS) return "active";
  return "dormant";
}

// ── Sortable header ────────────────────────────────────────────────────────

interface SortableHeadProps {
  label: string;
  field: UserSortField;
  activeField?: UserSortField | undefined;
  order?: "asc" | "desc" | undefined;
  onSort?: (field: UserSortField) => void;
  className?: string;
}

function SortableHead({ label, field, activeField, order, onSort, className }: SortableHeadProps) {
  const active = activeField === field;
  const Icon = active ? (order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={`text-right font-semibold text-white ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => onSort?.(field)}
        className="inline-flex items-center gap-1.5 hover:text-slate-200 disabled:hover:text-white transition-colors"
        disabled={!onSort}
      >
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 ${active ? "opacity-100" : "opacity-40"}`} />
      </button>
    </TableHead>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

interface UserTableProps {
  users: UserEntry[];
  currentUsername?: string;
  isLoading: boolean;
  error?: string | null;
  sortField?: UserSortField | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  onSort?: (field: UserSortField) => void;
  onEdit?: (user: UserEntry) => void;
  onDelete?: (userId: string) => void;
  onOpenDetails?: (user: UserEntry) => void;
}

export function UserTable({
  users,
  currentUsername,
  isLoading,
  error,
  sortField,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onOpenDetails,
}: UserTableProps) {
  const tErrors = useTranslations("errors.sections");
  const [deleteTarget, setDeleteTarget] = useState<UserEntry | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700 hover:bg-slate-700">
              <SortableHead
                label="שם משתמש"
                field="username"
                activeField={sortField}
                order={sortOrder}
                onSort={onSort}
              />
              <TableHead className="text-right font-semibold text-white w-28">תפקיד</TableHead>
              <TableHead className="text-right font-semibold text-white w-28">סטטוס</TableHead>
              <SortableHead
                label="פעיל לאחרונה"
                field="lastActivityAt"
                activeField={sortField}
                order={sortOrder}
                onSort={onSort}
                className="w-36"
              />
              <SortableHead
                label="התחברות אחרונה"
                field="lastLoginAt"
                activeField={sortField}
                order={sortOrder}
                onSort={onSort}
                className="w-36"
              />
              <TableHead className="text-right font-semibold text-white">קבוצות</TableHead>
              <SortableHead
                label="נוצר"
                field="createdAt"
                activeField={sortField}
                order={sortOrder}
                onSort={onSort}
                className="w-28"
              />
              <TableHead className="text-right font-semibold text-white w-32">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16">
                  <Spinner size="md" label="טוען משתמשים…" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-rose-500">
                  {tErrors("users")}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                  לא נמצאו משתמשים
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, idx) => {
                const isSelf = user.username === currentUsername;
                const status = deriveStatus(user);
                const isLive = status === "activeNow";
                return (
                  <TableRow
                    key={user._id}
                    className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100"}
                  >
                    <TableCell className="font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            isLive
                              ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                              : "bg-slate-300"
                          }`}
                          aria-label={isLive ? "מחובר עכשיו" : "לא פעיל"}
                          title={isLive ? "מחובר עכשיו" : "לא פעיל"}
                        />
                        <span className={user.disabled ? "line-through text-slate-400" : ""}>
                          {user.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[user.role] ?? ROLE_STYLES.guest}`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-slate-600 text-sm tabular-nums"
                      title={user.lastActivityAt ?? undefined}
                    >
                      {formatRelative(user.lastActivityAt)}
                    </TableCell>
                    <TableCell
                      className="text-slate-600 text-sm tabular-nums"
                      title={user.lastLoginAt ?? undefined}
                    >
                      {formatRelative(user.lastLoginAt)}
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
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                          onClick={() => onOpenDetails?.(user)}
                          title="פרטי משתמש"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
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
