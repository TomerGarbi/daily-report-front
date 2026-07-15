"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useLogs, useLogStats } from "@/hooks/useLogs";
import { useUsers, useUserStats, useUserMutations } from "@/hooks/useUsers";
import { useReportStats } from "@/hooks/useReports";
import { FullPageSpinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, ArrowRight, LayoutDashboard, Users, ScrollText, Activity as ActivityIcon } from "lucide-react";
// AdminOverview drags in the full `recharts` bundle (~150 KB gzipped). Load
// it only when the admin tab is actually mounted — the "logs" and "users"
// tabs never need it, so this shaves the initial admin-page chunk noticeably.
const AdminOverview = dynamic(
  () => import("@/components/admin/AdminOverview").then((m) => ({ default: m.AdminOverview })),
  {
    ssr: false,
    loading: () => <FullPageSpinner />,
  },
);
import { LogStatsCards } from "@/components/admin/LogStatsCards";
import { LogFilterBar, type LogFilters } from "@/components/admin/LogFilterBar";
import { LogTable } from "@/components/admin/LogTable";
import { LogDetailDialog } from "@/components/admin/LogDetailDialog";
import { UserStatsCards } from "@/components/admin/UserStatsCards";
import { UserFilterBar, type UserFilters } from "@/components/admin/UserFilterBar";
import { UserTable } from "@/components/admin/UserTable";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import type { LogEntry } from "@/types/log";
import type { UserEntry, UserRole, UserSortField } from "@/types/user";
import { toast } from "sonner";

const LOG_PAGE_SIZE = 50;
const USER_PAGE_SIZE = 20;

const EMPTY_LOG_FILTERS: LogFilters = {
  level: undefined,
  user: undefined,
  context: undefined,
  search: undefined,
  from: undefined,
  to: undefined,
};

const EMPTY_USER_FILTERS: UserFilters = {
  role: undefined,
  search: undefined,
  status: undefined,
};

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const groups = user?.groups ?? [];
  const isAdmin = user?.role === "admin";
  const canViewUsers = user?.role === "manager" || isAdmin || groups.includes("HR") || groups.includes("IT-Admins");
  const canViewLogs = isAdmin || groups.includes("IT-Admins");
  const canAccessAdmin = canViewUsers || canViewLogs;

  // ── Log state ──────────────────────────────────────────────────────────────
  const [logFilters, setLogFilters] = useState<LogFilters>(EMPTY_LOG_FILTERS);
  const [logPage, setLogPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const handleLogFiltersChange = useCallback((f: LogFilters) => {
    setLogFilters(f);
    setLogPage(1);
  }, []);

  const { stats: logStats, isLoading: logStatsLoading } = useLogStats();
  const {
    logs,
    total: logTotal,
    totalPages: logTotalPages,
    isLoading: logsLoading,
    error: logsError,
  } = useLogs({
    level: logFilters.level || undefined,
    user: logFilters.user || undefined,
    context: logFilters.context || undefined,
    search: logFilters.search || undefined,
    from: logFilters.from || undefined,
    to: logFilters.to || undefined,
    page: logPage,
    limit: LOG_PAGE_SIZE,
  });

  // ── User state ─────────────────────────────────────────────────────────────
  const [userFilters, setUserFilters] = useState<UserFilters>(EMPTY_USER_FILTERS);
  const [userPage, setUserPage] = useState(1);
  const [userSort, setUserSort] = useState<{ field: UserSortField; order: "asc" | "desc" }>({
    field: "username",
    order: "asc",
  });
  const [editingUser, setEditingUser] = useState<UserEntry | null>(null);
  const [viewingUser, setViewingUser] = useState<UserEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUserFiltersChange = useCallback((f: UserFilters) => {
    setUserFilters(f);
    setUserPage(1);
  }, []);

  /**
   * Toggle sort direction when clicking the same column, otherwise switch
   * columns and use a sensible default: username asc, dates desc.
   */
  const handleUserSort = useCallback((field: UserSortField) => {
    setUserSort((prev) => {
      if (prev.field === field) {
        return { field, order: prev.order === "asc" ? "desc" : "asc" };
      }
      return { field, order: field === "username" ? "asc" : "desc" };
    });
    setUserPage(1);
  }, []);

  const { stats: userStats, isLoading: userStatsLoading } = useUserStats();
  const {
    users,
    total: userTotal,
    totalPages: userTotalPages,
    isLoading: usersLoading,
    error: usersError,
  } = useUsers({
    role: userFilters.role || undefined,
    search: userFilters.search || undefined,
    status: userFilters.status || undefined,
    sort: userSort.field,
    order: userSort.order,
    page: userPage,
    limit: USER_PAGE_SIZE,
  });

  const { patchUser, removeUser } = useUserMutations();

  // ── Report stats ───────────────────────────────────────────────────────────
  const { stats: reportStats, isLoading: reportStatsLoading } = useReportStats();

  // Build group options from stats
  const groupOptions = useMemo(
    () =>
      (userStats?.byGroup ?? []).map((g) => ({
        value: g.groupId,
        label: g.group,
      })),
    [userStats],
  );

  const handleEditSave = useCallback(
    async (userId: string, updates: { role?: UserRole; groups?: string[] }) => {
      setSaving(true);
      try {
        await patchUser(userId, updates);
        toast.success("המשתמש עודכן בהצלחה");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "שגיאה בעדכון המשתמש");
      } finally {
        setSaving(false);
      }
    },
    [patchUser],
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        await removeUser(userId);
        toast.success("המשתמש נמחק בהצלחה");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "שגיאה במחיקת המשתמש");
      }
    },
    [removeUser],
  );

  // ── Auth guards ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccessAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, canAccessAdmin, router]);

  if (isLoading) {
    return <FullPageSpinner label="טוען ניהול…" />;
  }

  if (!isAuthenticated || !canAccessAdmin) return null;

  const overviewLoading = userStatsLoading || logStatsLoading || reportStatsLoading;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ניהול מערכת</h1>
              <p className="text-sm text-slate-500">ממשק ניהול למנהלי המערכת</p>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="gap-1.5"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה לדף הבית
            </Button>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="h-11 w-full justify-start gap-1 rounded-2xl bg-slate-100 p-1">
            <TabsTrigger value="overview" className="gap-1.5 rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <LayoutDashboard className="h-4 w-4" />
              סקירה כללית
            </TabsTrigger>
            {canViewUsers && (
              <TabsTrigger value="users" className="gap-1.5 rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                משתמשים
              </TabsTrigger>
            )}
            {canViewLogs && (
              <TabsTrigger value="logs" className="gap-1.5 rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ScrollText className="h-4 w-4" />
                יומן מערכת
              </TabsTrigger>
            )}
            {canViewLogs && (
              <TabsTrigger value="activity" className="gap-1.5 rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ActivityIcon className="h-4 w-4" />
                פעילות
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Overview tab ─────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-6">
            <AdminOverview
              userStats={userStats}
              logStats={logStats}
              reportStats={reportStats}
              isLoading={overviewLoading}
            />
          </TabsContent>

          {/* ── Users tab ────────────────────────────────────────────── */}
          <TabsContent value="users" className="mt-6 space-y-6">
            <UserStatsCards stats={userStats} isLoading={userStatsLoading} />

            <UserFilterBar
              filters={userFilters}
              onChange={handleUserFiltersChange}
              onClear={() => { setUserFilters(EMPTY_USER_FILTERS); setUserPage(1); }}
            />

            <UserTable
              users={users}
              currentUsername={user?.username}
              isLoading={usersLoading}
              error={usersError ? String(usersError) : null}
              sortField={userSort.field}
              sortOrder={userSort.order}
              onSort={handleUserSort}
              onEdit={setEditingUser}
              onDelete={handleDeleteUser}
              onOpenDetails={setViewingUser}
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{`${userTotal} משתמשים • עמוד ${userPage} מתוך ${userTotalPages}`}</span>
              <Pagination
                page={userPage}
                totalPages={userTotalPages}
                onPageChange={setUserPage}
                disabled={usersLoading}
              />
            </div>

            <UserEditDialog
              user={editingUser}
              open={!!editingUser}
              onOpenChange={(open) => { if (!open) setEditingUser(null); }}
              onSave={handleEditSave}
              groupOptions={groupOptions}
              saving={saving}
            />

            <UserDetailDrawer
              user={viewingUser}
              open={!!viewingUser}
              onOpenChange={(open) => { if (!open) setViewingUser(null); }}
              currentUsername={user?.username}
              onEdit={(u) => { setViewingUser(null); setEditingUser(u); }}
              onToggleDisabled={async (u, disabled) => {
                try {
                  await patchUser(u._id, { disabled });
                  toast.success(disabled ? "המשתמש הושבת" : "המשתמש הופעל");
                  // Reflect change immediately so the drawer badge updates
                  // without waiting for SWR revalidation.
                  setViewingUser({ ...u, disabled });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "שגיאה בעדכון סטטוס משתמש");
                }
              }}
            />
          </TabsContent>

          {/* ── Logs tab ─────────────────────────────────────────────── */}
          <TabsContent value="logs" className="mt-6 space-y-6">
            <LogStatsCards stats={logStats} isLoading={logStatsLoading} />

            <LogFilterBar
              filters={logFilters}
              onChange={handleLogFiltersChange}
              onClear={() => { setLogFilters(EMPTY_LOG_FILTERS); setLogPage(1); }}
            />

            <LogTable
              logs={logs}
              isLoading={logsLoading}
              error={logsError ? String(logsError) : null}
              onSelect={setSelectedLog}
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{`${logTotal} לוגים • עמוד ${logPage} מתוך ${logTotalPages}`}</span>
              <Pagination
                page={logPage}
                totalPages={logTotalPages}
                onPageChange={setLogPage}
                disabled={logsLoading}
              />
            </div>

            <LogDetailDialog
              log={selectedLog}
              open={!!selectedLog}
              onOpenChange={(open) => { if (!open) setSelectedLog(null); }}
            />
          </TabsContent>

          {/* ── Activity tab ─────────────────────────────────────────── */}
          {canViewLogs && (
            <TabsContent value="activity" className="mt-6 space-y-6">
              <ActivityFeed limit={50} variant="full" live title="פעילות אחרונה במערכת" />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
