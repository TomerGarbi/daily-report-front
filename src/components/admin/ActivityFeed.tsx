"use client";

/**
 * ActivityFeed
 *
 * Real-time (15 s polling) list of the most recent audit events. Renders in
 * two layout modes:
 *   • `variant="compact"` — dense 20-row list intended for the Overview tab.
 *   • `variant="full"`    — expanded list with resource label + IP + user-
 *     agent for the dedicated Activity tab.
 *
 * Each row shows a coloured icon per action category, the Hebrew action
 * label, actor username, resource label, and a relative timestamp. Failed
 * actions get a red outline + the reason surfaced from `event.meta.reason`.
 */

import { useMemo } from "react";
import {
  ShieldCheck, ShieldOff, ShieldAlert, LogOut, LogIn,
  UserCog, UserX, UserPlus, UserMinus, FileText, FilePlus, FileEdit, FileX,
  MapPin, Fuel, Activity as ActivityIcon,
} from "lucide-react";
import type { AuditEvent } from "@/types/audit";
import { useAuditEvents } from "@/hooks/useAuditEvents";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";

// ─── Action → icon + Hebrew label + colour ──────────────────────────────────

type ActionMeta = { icon: React.ComponentType<{ className?: string }>; label: string; color: string };

const ACTION_META: Record<string, ActionMeta> = {
  "auth.login":              { icon: LogIn,      label: "התחברות",             color: "text-emerald-600" },
  "auth.logout":             { icon: LogOut,     label: "התנתקות",             color: "text-slate-500"  },
  "auth.permission.denied":  { icon: ShieldAlert, label: "גישה נדחתה",         color: "text-amber-600"  },
  "user.role.change":        { icon: UserCog,    label: "שינוי תפקיד",         color: "text-blue-600"   },
  "user.groups.change":      { icon: UserCog,    label: "שינוי קבוצות",        color: "text-blue-600"   },
  "user.disable":            { icon: ShieldOff,  label: "השבתת משתמש",         color: "text-rose-600"   },
  "user.enable":             { icon: ShieldCheck, label: "הפעלת משתמש",        color: "text-emerald-600" },
  "user.delete":             { icon: UserMinus,  label: "מחיקת משתמש",         color: "text-rose-700"   },
  "report.create":           { icon: FilePlus,   label: "יצירת דוח",           color: "text-emerald-600" },
  "report.update":           { icon: FileEdit,   label: "עדכון דוח",           color: "text-blue-600"   },
  "report.publish":          { icon: FileText,   label: "פרסום דוח",           color: "text-violet-600" },
  "report.delete":           { icon: FileX,      label: "מחיקת דוח",           color: "text-rose-700"   },
  "station.create":          { icon: MapPin,     label: "יצירת תחנה",          color: "text-emerald-600" },
  "station.update":          { icon: MapPin,     label: "עדכון תחנה",          color: "text-blue-600"   },
  "station.delete":          { icon: MapPin,     label: "מחיקת תחנה",          color: "text-rose-700"   },
  "fuelSite.create":         { icon: Fuel,       label: "יצירת אתר דלק",       color: "text-emerald-600" },
  "fuelSite.update":         { icon: Fuel,       label: "עדכון אתר דלק",       color: "text-blue-600"   },
  "fuelSite.delete":         { icon: Fuel,       label: "מחיקת אתר דלק",       color: "text-rose-700"   },
};

const FALLBACK_META: ActionMeta = { icon: ActivityIcon, label: "פעולה", color: "text-slate-500" };
const FALLBACK_USER_META: ActionMeta = { icon: UserPlus, label: "פעולת משתמש", color: "text-slate-500" };
const FALLBACK_REPORT_META: ActionMeta = { icon: FileText, label: "פעולת דוח", color: "text-slate-500" };
const FALLBACK_STATION_META: ActionMeta = { icon: MapPin, label: "פעולת תחנה", color: "text-slate-500" };
const FALLBACK_FUEL_META: ActionMeta = { icon: Fuel, label: "פעולת אתר דלק", color: "text-slate-500" };
const FALLBACK_UX = new Set(["user", "report", "station", "fuelSite"]);

function metaFor(action: string, resourceType: string): ActionMeta {
  const known = ACTION_META[action];
  if (known) return known;
  // Unknown action — synthesize a label from the resource type so the row is
  // still meaningful without a code change.
  if (FALLBACK_UX.has(resourceType)) {
    if (resourceType === "user")     return FALLBACK_USER_META;
    if (resourceType === "report")   return FALLBACK_REPORT_META;
    if (resourceType === "station")  return FALLBACK_STATION_META;
    if (resourceType === "fuelSite") return FALLBACK_FUEL_META;
  }
  return FALLBACK_META;
}

// ─── Relative time helper (Hebrew) ──────────────────────────────────────────

const MINUTE = 60_000;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

function formatRelative(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  if (diff < 30_000)   return "הרגע";
  if (diff < HOUR)     return `לפני ${Math.max(1, Math.floor(diff / MINUTE))} דק'`;
  if (diff < DAY)      return `לפני ${Math.floor(diff / HOUR)} שע'`;
  if (diff < 7 * DAY)  return `לפני ${Math.floor(diff / DAY)} ימ'`;
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  limit?: number;
  variant?: "compact" | "full";
  /** When true, poll every 15 s. Default: true. */
  live?: boolean;
  /** Optional pre-filter — e.g. only render events for a single actor. */
  actor?: string;
  title?: string;
}

export function ActivityFeed({
  limit = 20,
  variant = "compact",
  live = true,
  actor,
  title = "פעילות אחרונה",
}: ActivityFeedProps) {
  // Stable "now" per render so all rows in a paint share a reference point.
  const now = useMemo(() => Date.now(), []);

  const { events, isLoading, error } = useAuditEvents({
    limit,
    live,
    ...(actor ? { actor } : {}),
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {live && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            חי
          </span>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading && events.length === 0 && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
        {error && (
          <p className="py-4 text-sm text-rose-600">
            {`שגיאה בטעינת יומן פעילות: ${error.message}`}
          </p>
        )}
        {!isLoading && !error && events.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            אין פעילות להצגה
          </p>
        )}

        <ul className="divide-y">
          {events.map((ev: AuditEvent) => {
            const m = metaFor(ev.action, ev.resourceType);
            const Icon = m.icon;
            const failed = ev.outcome === "failure";
            const reason = failed
              ? String((ev.meta as Record<string, unknown> | undefined)?.["reason"] ?? "")
              : "";

            return (
              <li
                key={ev._id}
                className={
                  "flex items-start gap-3 py-2.5 " +
                  (failed ? "text-slate-600" : "text-slate-800")
                }
              >
                <div
                  className={
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                    (failed ? "bg-rose-50" : "bg-slate-50")
                  }
                >
                  <Icon className={"h-4 w-4 " + (failed ? "text-rose-500" : m.color)} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-medium">{ev.actor}</span>
                    <span className="text-muted-foreground">{m.label}</span>
                    {ev.resourceLabel && (
                      <span className="truncate font-medium text-slate-700">
                        {`"${ev.resourceLabel}"`}
                      </span>
                    )}
                    {failed && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                        נכשל
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span>{formatRelative(ev.timestamp, now)}</span>
                    {variant === "full" && ev.ip && <span>IP: {ev.ip}</span>}
                    {variant === "full" && ev.requestId && (
                      <span className="font-mono">req: {ev.requestId.slice(0, 8)}</span>
                    )}
                    {reason && <span className="text-rose-600">{reason}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
