"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { AlertTriangle, Bug, Info, AlertCircle, Clock } from "lucide-react";
import type { LogStats } from "@/types/log";

interface LogStatsCardsProps {
  stats: LogStats | null;
  isLoading: boolean;
}

export function LogStatsCards({ stats, isLoading }: LogStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="סה״כ לוגים"
        value={stats?.total}
        icon={Info}
        iconColor="bg-blue-100 text-blue-600"
        accentClass="bg-blue-400"
        isLoading={isLoading}
      />
      <StatCard
        label="24 שעות אחרונות"
        value={stats?.recent?.last24Hours}
        icon={Clock}
        iconColor="bg-violet-100 text-violet-600"
        accentClass="bg-violet-400"
        isLoading={isLoading}
      />
      <StatCard
        label="7 ימים אחרונים"
        value={stats?.recent?.last7Days}
        icon={Clock}
        iconColor="bg-emerald-100 text-emerald-600"
        accentClass="bg-emerald-400"
        isLoading={isLoading}
      />
      <StatCard
        label="שגיאות"
        value={stats?.byLevel?.error}
        icon={AlertCircle}
        iconColor="bg-rose-100 text-rose-600"
        accentClass="bg-rose-400"
        isLoading={isLoading}
      />
      <StatCard
        label="אזהרות"
        value={stats?.byLevel?.warn}
        icon={AlertTriangle}
        iconColor="bg-amber-100 text-amber-600"
        accentClass="bg-amber-400"
        isLoading={isLoading}
      />
      <StatCard
        label="דיבאג"
        value={stats?.byLevel?.debug}
        icon={Bug}
        iconColor="bg-slate-100 text-slate-600"
        accentClass="bg-slate-400"
        isLoading={isLoading}
      />
    </div>
  );
}
