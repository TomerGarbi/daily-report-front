/**
 * i18n configuration shared between server and client.
 *
 * Locale routing is intentionally NOT enabled — the app currently runs
 * single-locale. Migration plan:
 *   1. (current) Source of truth = he. English scaffolded but not surfaced.
 *   2. Add a cookie/preference toggle to switch active locale at runtime.
 *   3. (optional, future) Move to App-Router `[locale]` segments for SEO.
 */

export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

/** Right-to-left locales for `<html dir>` selection. */
const RTL_LOCALES = new Set<Locale>(["he"]);

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}
