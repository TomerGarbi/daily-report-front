"use client";

/**
 * PreferencesProvider
 *
 * Loads the user's preferences from localStorage on mount, applies the
 * selected theme & density to the root <html> element, and exposes a
 * React context with a setter that persists changes.
 *
 * Components consume this via `usePreferences()`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  resolveTheme,
  type UserPreferences,
} from "@/lib/preferences";

interface PreferencesContextValue {
  prefs: UserPreferences;
  setPrefs: (next: UserPreferences) => void;
  resetPrefs: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function applyToDocument(prefs: UserPreferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const effective = resolveTheme(prefs.theme);
  root.classList.toggle("dark", effective === "dark");
  root.dataset.density = prefs.density;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const loaded = loadPreferences();
    setPrefsState(loaded);
    applyToDocument(loaded);
  }, []);

  // React to system colour-scheme changes when the user picked "system".
  useEffect(() => {
    if (prefs.theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyToDocument(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs]);

  const setPrefs = useCallback((next: UserPreferences) => {
    setPrefsState(next);
    savePreferences(next);
    applyToDocument(next);
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFERENCES);
  }, [setPrefs]);

  const value = useMemo(
    () => ({ prefs, setPrefs, resetPrefs }),
    [prefs, setPrefs, resetPrefs],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
