"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { Users, UserPlus, Shield, UserCog, UserX, Clock } from "lucide-react";
import type { UserStats } from "@/types/user";

interface UserStatsCardsProps {
  stats: UserStats | null;
  isLoading: boolean;
}

export function UserStatsCards({ stats, isLoading }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="סה״כ משתמשים"
        value={stats?.total}
        icon={Users}
        iconColor="bg-blue-100 text-blue-600"
        accentClass="bg-blue-400"
        isLoading={isLoading}
      />
      <StatCard
        label="מנהלים"
        value={stats?.byRole?.admin}
        icon={Shield}
        iconColor="bg-rose-100 text-rose-600"
        accentClass="bg-rose-400"
        isLoading={isLoading}
      />
      <StatCard
        label="מנהלי ביניים"
        value={stats?.byRole?.manager}
        icon={UserCog}
        iconColor="bg-violet-100 text-violet-600"
        accentClass="bg-violet-400"
        isLoading={isLoading}
      />
      <StatCard
        label="משתמשים"
        value={stats?.byRole?.user}
        icon={Users}
        iconColor="bg-emerald-100 text-emerald-600"
        accentClass="bg-emerald-400"
        isLoading={isLoading}
      />
      <StatCard
        label="אורחים"
        value={stats?.byRole?.guest}
        icon={UserX}
        iconColor="bg-amber-100 text-amber-600"
        accentClass="bg-amber-400"
        isLoading={isLoading}
      />
      <StatCard
        label="30 ימים אחרונים"
        value={stats?.recent?.last30Days}
        icon={Clock}
        iconColor="bg-slate-100 text-slate-600"
        accentClass="bg-slate-400"
        isLoading={isLoading}
      />
    </div>
  );
}
