import {
  Building2,
  Palette,
  Activity,
  UserCircle,
} from "lucide-react";

export interface SettingsNavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When true, only admins / IT-Admins see the link. */
  requiresManage?: boolean;
}

/**
 * Single source of truth for the settings sub-pages — the sidebar nav,
 * the hub page cards, and the breadcrumb header all read from this list.
 *
 * Lives outside of `layout.tsx` because Next.js App Router restricts
 * the exports allowed from route files (page/layout/route/etc.).
 */
export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    href: "/settings/stations",
    label: "תחנות ויחידות",
    description: "ניהול קטלוג התחנות והיחידות. ערכים אלה משמשים כברירת-מחדל בדוחות היומיים.",
    icon: Building2,
    requiresManage: false, // any user can browse; mutations are gated server-side
  },
  {
    href: "/settings/appearance",
    label: "מראה",
    description: "ערכת נושא, צפיפות טבלאות, והעדפות תצוגה אישיות.",
    icon: Palette,
  },
  {
    href: "/settings/statuses",
    label: "סטטוסים של יחידות",
    description: "התאמת תוויות וצבעים של סטטוסי היחידות בדוחות.",
    icon: Activity,
  },
  {
    href: "/settings/account",
    label: "חשבון",
    description: "פרטי המשתמש, תפקיד וקבוצות.",
    icon: UserCircle,
  },
];
