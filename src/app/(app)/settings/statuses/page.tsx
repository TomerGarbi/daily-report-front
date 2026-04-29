"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { usePreferences } from "@/components/PreferencesProvider";
import {
  DEFAULT_STATUS_PREFERENCES,
  type StationStatusKey,
  type StatusPreference,
} from "@/lib/preferences";

const STATUS_KEYS: { key: StationStatusKey; defaultEnglish: string }[] = [
  { key: "Active",      defaultEnglish: "Active" },
  { key: "Inactive",    defaultEnglish: "Inactive" },
  { key: "Maintenance", defaultEnglish: "Maintenance" },
];

/**
 * Pre-set Tailwind colour palettes — pasting raw class strings is also
 * supported via the free-text field below each preset row.
 */
const COLOR_PRESETS: { name: string; classes: string }[] = [
  { name: "ירוק",   classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { name: "אדום",   classes: "bg-red-100 text-red-700 border-red-200" },
  { name: "כתום",   classes: "bg-amber-100 text-amber-700 border-amber-200" },
  { name: "כחול",   classes: "bg-sky-100 text-sky-700 border-sky-200" },
  { name: "סגול",   classes: "bg-violet-100 text-violet-700 border-violet-200" },
  { name: "אפור",   classes: "bg-slate-100 text-slate-700 border-slate-200" },
];

export default function StatusesSettingsPage() {
  const { prefs, setPrefs } = usePreferences();

  const update = (key: StationStatusKey, patch: Partial<StatusPreference>) => {
    setPrefs({
      ...prefs,
      statuses: { ...prefs.statuses, [key]: { ...prefs.statuses[key], ...patch } },
    });
  };

  const resetSection = () => {
    setPrefs({ ...prefs, statuses: DEFAULT_STATUS_PREFERENCES });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">סטטוסים של יחידות</h2>
          <p className="text-sm text-muted-foreground">
            התאמת תוויות וצבעים של סטטוסי היחידות. השינויים ישפיעו על תצוגת הטבלאות בדוחות.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetSection} className="gap-1.5 text-slate-600">
          <RotateCcw className="h-4 w-4" />
          איפוס סטטוסים
        </Button>
      </div>

      <div className="space-y-4">
        {STATUS_KEYS.map(({ key, defaultEnglish }) => {
          const pref = prefs.statuses[key];
          return (
            <section
              key={key}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{defaultEnglish}</h3>
                  <p className="text-xs text-muted-foreground">
                    מזהה פנימי קבוע — לא ניתן לשנות. ניתן להתאים את התווית והצבע.
                  </p>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${pref.color}`}
                >
                  {pref.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldText
                  label="תווית"
                  value={pref.label}
                  onChange={(e) => update(key, { label: e.target.value })}
                />
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">צבע</div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((p) => {
                    const active = pref.color === p.classes;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => update(key, { color: p.classes })}
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${p.classes} hover:opacity-80 transition ${
                          active ? "ring-2 ring-offset-1 ring-orange-400" : ""
                        }`}
                        aria-pressed={active}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
