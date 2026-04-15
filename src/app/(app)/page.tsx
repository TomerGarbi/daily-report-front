"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useReportStats } from "@/hooks/useReports";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import {
  FileText,
  PlusCircle,
  CalendarDays,
  LayoutList,
  BarChart2,
  CheckCircle2,
  ListTodo,
  ShieldCheck,
} from "lucide-react";
import { FullPageSpinner } from "@/components/Spinner";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useReportStats();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <FullPageSpinner label="טוען לוח בקרה…" />;
  }

  if (!isAuthenticated) return null;

  const displayName =
    (user?.username as string) ??
    (user?.name as string) ??
    (user?.sub as string);

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Hero Header */}
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">לוח בקרה</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
            שלום, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stats Row */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">סטטיסטיקות</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="סה״כ דוחות"
              value={stats?.total}
              icon={FileText}
              iconColor="bg-blue-100 text-blue-600"
              accentClass="bg-blue-400"
              isLoading={statsLoading}
            />
            <StatCard
              label="30 ימים אחרונים"
              value={stats?.recent?.last30Days}
              icon={BarChart2}
              iconColor="bg-violet-100 text-violet-600"
              accentClass="bg-violet-400"
              isLoading={statsLoading}
            />
            <StatCard
              label="7 ימים אחרונים"
              value={stats?.recent?.last7Days}
              icon={CalendarDays}
              iconColor="bg-emerald-100 text-emerald-600"
              accentClass="bg-emerald-400"
              isLoading={statsLoading}
            />
            <StatCard
              label="טיוטות"
              value={stats?.byStatus?.draft}
              icon={CheckCircle2}
              iconColor="bg-amber-100 text-amber-600"
              accentClass="bg-amber-400"
              isLoading={statsLoading}
            />
          </div>
        </section>

        {/* Action Buttons Grid */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">פעולות מהירות</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <ActionButton
              href="/reports/new"
              label="יצירת דוח חדש"
              description="מלא דוח יומי"
              icon={PlusCircle}
              colors={["#d1fae5", "#6ee7b7"]}
              shadow="rgba(5,150,105,0.2)"
              darkText
            />
            <ActionButton
              href="/reports"
              label="כל הדוחות"
              description="עיין בדוחות קודמים"
              icon={LayoutList}
              colors={["#dbeafe", "#93c5fd"]}
              shadow="rgba(37,99,235,0.2)"
              darkText
            />
            <ActionButton
              href="/calendar"
              label="תצוגת לוח שנה"
              description="סקירה חודשית"
              icon={CalendarDays}
              colors={["#ede9fe", "#c4b5fd"]}
              shadow="rgba(124,58,237,0.2)"
              darkText
            />
            <ActionButton
              href="/analytics"
              label="אנליטיקס"
              description="נתונים וגרפים"
              icon={BarChart2}
              colors={["#ffedd5", "#fdba74"]}
              shadow="rgba(234,88,12,0.2)"
              darkText
            />
            <ActionButton
              href="/todo"
              label="רשימת משימות"
              description="ניהול משימות יומיות"
              icon={ListTodo}
              colors={["#ffe4e6", "#fda4af"]}
              shadow="rgba(219,39,119,0.2)"
              darkText
            />
            {user?.role === "admin" && (
              <ActionButton
                href="/admin"
                label="ניהול מערכת"
                description="ממשק מנהלים"
                icon={ShieldCheck}
                colors={["#fce4ec", "#f48fb1"]}
                shadow="rgba(233,30,99,0.2)"
                darkText
              />
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
