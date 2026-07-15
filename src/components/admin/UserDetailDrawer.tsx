"use client";

/**
 * UserDetailDrawer
 *
 * Slide-out panel that concentrates every angle on a single user account:
 *
 *   • Profile   — identity + status, with an inline "עריכה" button that
 *                 opens the existing `UserEditDialog` (no duplicated form).
 *   • Activity  — audit-trail timeline reusing `ActivityFeed` filtered by
 *                 the user's username.
 *   • Sessions  — login counters, last-seen / last-login timestamps, and
 *                 last-known IP.
 *   • Errors    — recent Winston `error`/`warn` log entries emitted while
 *                 the user was authenticated (best-effort match on `user`).
 *
 * Rendered as a controlled sheet — parent owns the currently-selected user
 * so the same instance can be reused across list rows.
 */

import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/Spinner";
import {
  User as UserIcon, Activity as ActivityIcon, KeyRound, AlertOctagon, Pencil,
  ShieldOff, ShieldCheck,
} from "lucide-react";
import type { UserEntry } from "@/types/user";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { useLogs } from "@/hooks/useLogs";

// ─── Small display helpers ──────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  guest: "אורח", user: "משתמש", manager: "מנהל", admin: "מנהל מערכת",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "מעולם לא";
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function KeyValue({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={"text-sm text-slate-800 " + (mono ? "font-mono tabular-nums" : "")}>{value}</dd>
    </div>
  );
}

// ─── Errors tab ─────────────────────────────────────────────────────────────

/**
 * Fetches recent warn+error logs for a user. Two SWR calls (one per level)
 * are cheaper than filtering client-side, and the backend returns them
 * newest-first so we merge + trim to the last 20.
 */
function UserErrorsPanel({ username }: { username: string }) {
  const { logs: errorLogs, isLoading: e, error: errE } = useLogs({ level: "error", user: username, limit: 20, page: 1 });
  const { logs: warnLogs,  isLoading: w, error: errW } = useLogs({ level: "warn",  user: username, limit: 20, page: 1 });

  const isLoading = e || w;
  const anyErr = errE ?? errW;
  const merged = [...errorLogs, ...warnLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (anyErr)    return <p className="py-4 text-sm text-rose-600">{`שגיאה בטעינת לוגים: ${String(anyErr)}`}</p>;
  if (merged.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">לא נמצאו שגיאות עבור משתמש זה</p>;
  }

  return (
    <ul className="divide-y">
      {merged.map((log) => (
        <li key={log._id} className="py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                (log.level === "error"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700")
              }
            >
              {log.level}
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
            {log.context && <span className="text-xs text-muted-foreground">· {log.context}</span>}
          </div>
          <p className="mt-1 truncate text-slate-800" title={log.message}>{log.message}</p>
        </li>
      ))}
    </ul>
  );
}

// ─── Main drawer ────────────────────────────────────────────────────────────

interface UserDetailDrawerProps {
  user: UserEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the "עריכה" button is clicked — usually flips to the edit dialog. */
  onEdit?: (user: UserEntry) => void;
  /** Toggle disabled state directly from the drawer. */
  onToggleDisabled?: (user: UserEntry, disabled: boolean) => Promise<void> | void;
  currentUsername?: string | undefined;
}

export function UserDetailDrawer({
  user,
  open,
  onOpenChange,
  onEdit,
  onToggleDisabled,
  currentUsername,
}: UserDetailDrawerProps) {
  const [toggling, setToggling] = useState(false);

  if (!user) return null;

  const isSelf = user.username === currentUsername;
  const groupNames = user.groups.map((g) => g.name).join(", ") || "—";

  const handleDisableToggle = async () => {
    if (!onToggleDisabled) return;
    setToggling(true);
    try {
      await onToggleDisabled(user, !user.disabled);
    } finally {
      setToggling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg overflow-y-auto"
        dir="rtl"
      >
        <SheetHeader className="text-right">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg">{user.username}</SheetTitle>
                <SheetDescription className="text-xs">
                  {ROLE_LABELS[user.role] ?? user.role}
                  {user.disabled && <span className="ms-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">מושבת</span>}
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-6" dir="rtl">
          <TabsList className="w-full justify-start gap-1 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="profile"  className="gap-1 rounded-lg data-[state=active]:bg-white">
              <UserIcon className="h-3.5 w-3.5" /> פרופיל
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1 rounded-lg data-[state=active]:bg-white">
              <ActivityIcon className="h-3.5 w-3.5" /> פעילות
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-1 rounded-lg data-[state=active]:bg-white">
              <KeyRound className="h-3.5 w-3.5" /> חיבורים
            </TabsTrigger>
            <TabsTrigger value="errors"   className="gap-1 rounded-lg data-[state=active]:bg-white">
              <AlertOctagon className="h-3.5 w-3.5" /> שגיאות
            </TabsTrigger>
          </TabsList>

          {/* ── Profile ─────────────────────────────────────────────────── */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            <dl className="rounded-xl border bg-white px-4 py-2">
              <KeyValue label="שם משתמש" value={user.username} mono />
              <KeyValue label="תפקיד" value={ROLE_LABELS[user.role] ?? user.role} />
              <KeyValue label="קבוצות" value={groupNames} />
              <KeyValue label="סטטוס חשבון" value={user.disabled ? "מושבת" : "פעיל"} />
              <KeyValue label="נוצר בתאריך" value={formatDate(user.createdAt)} />
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit?.(user)}
                disabled={isSelf}
                className="gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                עריכת תפקיד וקבוצות
              </Button>
              {onToggleDisabled && (
                <Button
                  variant={user.disabled ? "default" : "outline"}
                  onClick={handleDisableToggle}
                  disabled={isSelf || toggling}
                  className={"gap-1.5 " + (user.disabled ? "bg-emerald-600 hover:bg-emerald-700" : "text-rose-700 hover:bg-rose-50")}
                >
                  {user.disabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                  {user.disabled ? "הפעל חשבון" : "השבת חשבון"}
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ── Activity ────────────────────────────────────────────────── */}
          <TabsContent value="activity" className="mt-4">
            <ActivityFeed
              actor={user.username}
              limit={50}
              variant="full"
              live={false}
              title={`פעילות של ${user.username}`}
            />
          </TabsContent>

          {/* ── Sessions ────────────────────────────────────────────────── */}
          <TabsContent value="sessions" className="mt-4">
            <dl className="rounded-xl border bg-white px-4 py-2">
              <KeyValue label="מספר התחברויות" value={user.loginCount ?? 0} mono />
              <KeyValue label="ניסיונות כושלים" value={user.failedLoginCount ?? 0} mono />
              <KeyValue label="התחברות אחרונה" value={formatDate(user.lastLoginAt)} />
              <KeyValue label="פעילות אחרונה" value={formatDate(user.lastActivityAt)} />
              <KeyValue label="כתובת IP אחרונה" value={user.lastLoginIp ?? "—"} mono />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              מידע זה נאסף עם כל התחברות ומתעדכן על כל בקשה מאומתת של המשתמש.
            </p>
          </TabsContent>

          {/* ── Errors ──────────────────────────────────────────────────── */}
          <TabsContent value="errors" className="mt-4">
            <UserErrorsPanel username={user.username} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
