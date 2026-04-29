"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SETTINGS_NAV } from "@/app/(app)/settings/nav";

/**
 * Settings hub — landing card grid that links to every sub-page.
 *
 * The same nav definition powers the sidebar in the surrounding layout
 * so adding a new settings area only requires editing the nav array.
 */
export default function SettingsHubPage() {
  const { user } = useAuth();
  const groups = user?.groups ?? [];
  const canManage = user?.role === "admin" || groups.includes("IT-Admins");

  const visible = SETTINGS_NAV.filter((n) => !n.requiresManage || canManage);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visible.map(({ href, label, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600 group-hover:bg-orange-100 transition-colors">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 group-hover:text-orange-700">
                  {label}
                </h3>
                <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
