"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLogs, useLogStats } from "@/hooks/useLogs";
import { useUsers, useUserStats, useUserMutations } from "@/hooks/useUsers";
import { useReportStats } from "@/hooks/useReports";
import { FullPageSpinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, ArrowRight, LayoutDashboard, Users, ScrollText } from "lucide-react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { LogStatsCards } from "@/components/admin/LogStatsCards";
import { LogFilterBar, type LogFilters } from "@/components/admin/LogFilterBar";
import { LogTable } from "@/components/admin/LogTable";
import { LogDetailDialog } from "@/components/admin/LogDetailDialog";
import { UserStatsCards } from "@/components/admin/UserStatsCards";
import { UserFilterBar, type UserFilters } from "@/components/admin/UserFilterBar";
import { UserTable } from "@/components/admin/UserTable";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import type { LogEntry } from "@/types/log";
import type { UserEntry, UserRole } from "@/types/user";
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
};

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "admin";

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
  const [editingUser, setEditingUser] = useState<UserEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUserFiltersChange = useCallback((f: UserFilters) => {
    setUserFilters(f);
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
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) {
    return <FullPageSpinner label="טוען ניהול…" />;
  }

  if (!isAuthenticated || !isAdmin) return null;

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
            <TabsTrigger value="users" className="gap-1.5 rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              משתמשים
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5 rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ScrollText className="h-4 w-4" />
              יומן מערכת
            </TabsTrigger>
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
              onEdit={setEditingUser}
              onDelete={handleDeleteUser}
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
        </Tabs>
      </div>
    </div>
  );
}
