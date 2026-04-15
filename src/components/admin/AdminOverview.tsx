"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, FileText, Activity, TrendingUp } from "lucide-react";
import type { UserStats } from "@/types/user";
import type { LogStats } from "@/types/log";
import type { ReportStats } from "@/lib/api";

// ─── Colours ─────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin: "#e11d48",
  manager: "#7c3aed",
  user: "#059669",
  guest: "#94a3b8",
};

const LOG_COLORS: Record<string, string> = {
  error: "#e11d48",
  warn: "#d97706",
  info: "#2563eb",
  debug: "#64748b",
};

const STATUS_COLORS: Record<string, string> = {
  published: "#059669",
  draft: "#d97706",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: "מנהל",
  manager: "מנהל ביניים",
  user: "משתמש",
  guest: "אורח",
};

const LOG_LABELS: Record<string, string> = {
  error: "שגיאה",
  warn: "אזהרה",
  info: "מידע",
  debug: "דיבאג",
};

const STATUS_LABELS: Record<string, string> = {
  published: "פורסם",
  draft: "טיוטה",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminOverviewProps {
  userStats: UserStats | null;
  logStats: LogStats | null;
  reportStats: ReportStats | null;
  isLoading: boolean;
}

// ─── Mini stat card ──────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-7 w-14 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="text-2xl font-bold tabular-nums text-slate-800">
            {value ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-slate-600">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-slate-800">
          <span className="inline-block h-2 w-2 rounded-full me-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Custom pie label ────────────────────────────────────────────────────────

function renderPieLabel({ name, percent }: { name: string; percent: number }) {
  if (percent < 0.05) return null;
  return `${name} ${(percent * 100).toFixed(0)}%`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminOverview({ userStats, logStats, reportStats, isLoading }: AdminOverviewProps) {
  // Transform data for charts
  const roleData = useMemo(() => {
    if (!userStats?.byRole) return [];
    return Object.entries(userStats.byRole).map(([role, count]) => ({
      name: ROLE_LABELS[role] ?? role,
      value: count,
      role,
    }));
  }, [userStats]);

  const logLevelData = useMemo(() => {
    if (!logStats?.byLevel) return [];
    return Object.entries(logStats.byLevel).map(([level, count]) => ({
      name: LOG_LABELS[level] ?? level,
      value: count,
      level,
    }));
  }, [logStats]);

  const reportStatusData = useMemo(() => {
    if (!reportStats?.byStatus) return [];
    return Object.entries(reportStats.byStatus)
      .filter(([, count]) => count != null)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status] ?? status,
        value: count ?? 0,
        status,
      }));
  }, [reportStats]);

  const dailyData = useMemo(() => {
    if (!reportStats?.dailyCounts) return [];
    return reportStats.dailyCounts.slice(-14).map((d) => ({
      date: new Date(d.date).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }),
      count: d.count,
    }));
  }, [reportStats]);

  const topAuthors = useMemo(() => {
    if (!reportStats?.topAuthors) return [];
    return reportStats.topAuthors.slice(0, 5).map((a) => ({
      name: a.username,
      count: a.count,
    }));
  }, [reportStats]);

  return (
    <div className="space-y-6">
      {/* ── Summary cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="סה״כ משתמשים" value={userStats?.total} icon={Users} color="#2563eb" isLoading={isLoading} />
        <MiniStat label="סה״כ דוחות" value={reportStats?.total} icon={FileText} color="#059669" isLoading={isLoading} />
        <MiniStat label="סה״כ לוגים" value={logStats?.total} icon={Activity} color="#7c3aed" isLoading={isLoading} />
        <MiniStat
          label="דוחות השבוע"
          value={reportStats?.recent?.last7Days}
          icon={TrendingUp}
          color="#d97706"
          isLoading={isLoading}
        />
      </div>

      {/* ── Charts grid ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users by role — Pie chart */}
        <ChartCard title="משתמשים לפי תפקיד" isLoading={isLoading}>
          {roleData.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderPieLabel}
                  animationBegin={0}
                  animationDuration={600}
                >
                  {roleData.map((d) => (
                    <Cell key={d.role} fill={ROLE_COLORS[d.role] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Log levels — Pie chart */}
        <ChartCard title="לוגים לפי רמה" isLoading={isLoading}>
          {logLevelData.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={logLevelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderPieLabel}
                  animationBegin={0}
                  animationDuration={600}
                >
                  {logLevelData.map((d) => (
                    <Cell key={d.level} fill={LOG_COLORS[d.level] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Reports by status — Bar chart */}
        <ChartCard title="דוחות לפי סטטוס" isLoading={isLoading}>
          {reportStatusData.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reportStatusData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={600}>
                  {reportStatusData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Daily reports — Bar chart */}
        <ChartCard title="דוחות יומיים (14 ימים אחרונים)" isLoading={isLoading}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="דוחות" fill="#2563eb" radius={[6, 6, 0, 0]} animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">אין נתונים</p>
          )}
        </ChartCard>
      </div>

      {/* ── Top authors & groups ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top authors */}
        <ChartCard title="כותבים מובילים" isLoading={isLoading}>
          {topAuthors.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAuthors} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="דוחות" fill="#7c3aed" radius={[0, 6, 6, 0]} animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">אין נתונים</p>
          )}
        </ChartCard>

        {/* Groups breakdown */}
        <ChartCard title="קבוצות משתמשים" isLoading={isLoading}>
          {(userStats?.byGroup?.length ?? 0) > 0 ? (
            <div className="space-y-3 px-1 py-2">
              {userStats!.byGroup.map((g) => {
                const pct = userStats!.total > 0 ? Math.round((g.count / userStats!.total) * 100) : 0;
                return (
                  <div key={g.groupId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{g.group}</span>
                      <span className="tabular-nums text-slate-500">{g.count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">אין נתונים</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Chart card wrapper ──────────────────────────────────────────────────────

function ChartCard({
  title,
  isLoading,
  children,
}: {
  title: string;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      {isLoading ? (
        <div className="flex h-[260px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
