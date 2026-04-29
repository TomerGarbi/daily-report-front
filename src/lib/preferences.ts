/**
 * preferences.ts
 *
 * Client-side user preferences persisted in localStorage.
 *
 * These are display-layer customisations that don't need server state
 * (theme, table density, status labels & colours, etc.). Anything that
 * affects multiple users / data integrity belongs server-side instead
 * (see /settings/stations).
 */

export type ThemeMode = "light" | "dark" | "system";
export type TableDensity = "comfortable" | "compact";

/** Display override for a single station status. */
export interface StatusPreference {
  /** Hebrew label shown in tables / dropdowns. */
  label: string;
  /**
   * Tailwind class string used in `statusColor()` — kept verbatim so power
   * users can paste any classes they want.
   */
  color: string;
}

export type StationStatusKey = "Active" | "Inactive" | "Maintenance";

export interface UserPreferences {
  theme: ThemeMode;
  density: TableDensity;
  statuses: Record<StationStatusKey, StatusPreference>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_STATUS_PREFERENCES: Record<StationStatusKey, StatusPreference> = {
  Active:      { label: "פעיל",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  Inactive:    { label: "לא פעיל", color: "bg-red-100 text-slate-600 border-slate-200" },
  Maintenance: { label: "תחזוקה",  color: "bg-amber-100 text-amber-700 border-amber-200" },
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme:    "light",
  density:  "comfortable",
  statuses: DEFAULT_STATUS_PREFERENCES,
};

const STORAGE_KEY = "daily-report:preferences:v1";

// ─── IO ───────────────────────────────────────────────────────────────────────

/**
 * Read preferences from localStorage with a deep merge against defaults so
 * users on older builds that don't yet have new keys still get sane values.
 */
export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      theme:   parsed.theme   ?? DEFAULT_PREFERENCES.theme,
      density: parsed.density ?? DEFAULT_PREFERENCES.density,
      statuses: {
        Active:      { ...DEFAULT_STATUS_PREFERENCES.Active,      ...(parsed.statuses?.Active      ?? {}) },
        Inactive:    { ...DEFAULT_STATUS_PREFERENCES.Inactive,    ...(parsed.statuses?.Inactive    ?? {}) },
        Maintenance: { ...DEFAULT_STATUS_PREFERENCES.Maintenance, ...(parsed.statuses?.Maintenance ?? {}) },
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Quota exceeded / private mode — non-fatal.
  }
}

/**
 * Resolve the effective theme (handles `system` by reading the media query).
 */
export function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
