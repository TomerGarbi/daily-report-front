"use client";

import { Sun, Moon, MonitorSmartphone, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/PreferencesProvider";
import type { ThemeMode, TableDensity } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light",  label: "בהיר",   icon: Sun },
  { value: "dark",   label: "כהה",    icon: Moon },
  { value: "system", label: "מערכת", icon: MonitorSmartphone },
];

const DENSITY_OPTIONS: { value: TableDensity; label: string; description: string }[] = [
  { value: "comfortable", label: "רווח",  description: "תצוגה מרווחת עם פדינג גדול." },
  { value: "compact",     label: "צפוף",  description: "תצוגה צפופה — מציגה יותר שורות במסך." },
];

export default function AppearanceSettingsPage() {
  const { prefs, setPrefs, resetPrefs } = usePreferences();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">מראה</h2>
          <p className="text-sm text-muted-foreground">
            העדפות תצוגה אישיות. נשמרות באופן מקומי בדפדפן זה.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetPrefs}
          className="gap-1.5 text-slate-600"
        >
          <RotateCcw className="h-4 w-4" />
          איפוס לברירת-מחדל
        </Button>
      </div>

      {/* Theme */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">ערכת נושא</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = prefs.theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, theme: value })}
                className={cn(
                  "rounded-xl border p-4 text-right transition-all",
                  active
                    ? "border-orange-300 bg-orange-50 ring-2 ring-orange-200"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <Icon className={cn("h-5 w-5 mb-2", active ? "text-orange-600" : "text-slate-500")} />
                <div className={cn("font-medium", active ? "text-orange-700" : "text-slate-800")}>
                  {label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Density */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">צפיפות תצוגה</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DENSITY_OPTIONS.map(({ value, label, description }) => {
            const active = prefs.density === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, density: value })}
                className={cn(
                  "rounded-xl border p-4 text-right transition-all",
                  active
                    ? "border-orange-300 bg-orange-50 ring-2 ring-orange-200"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <div className={cn("font-medium", active ? "text-orange-700" : "text-slate-800")}>
                  {label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
