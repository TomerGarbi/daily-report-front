"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SETTINGS_NAV } from "./nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const groups = user?.groups ?? [];
  const canManage = user?.role === "admin" || groups.includes("IT-Admins");

  // Hide management-only entries for non-admins so the sidebar doesn't
  // dangle dead links. Server-side authorisation is the real gate.
  const visibleNav = SETTINGS_NAV.filter((n) => !n.requiresManage || canManage);

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-slate-50/40" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-7 w-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">הגדרות</h1>
            <p className="text-sm text-muted-foreground">
              ניהול הגדרות המערכת והעדפות אישיות.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <aside>
            <nav className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-32">
              {visibleNav.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname?.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm border-b border-slate-100 last:border-b-0 transition-colors",
                      isActive
                        ? "bg-orange-50 text-orange-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}
