import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";

/**
 * Server-side i18n config consumed by next-intl's plugin.
 *
 * We currently always serve the default locale; once a runtime locale
 * switcher is added (cookie / user preference / `[locale]` segment),
 * resolve it here and return the matching messages bundle.
 */
export default getRequestConfig(async () => {
  const locale: Locale = defaultLocale;

  // Defensive: fall back to default if an unsupported locale ever leaks in.
  const safeLocale: Locale = (locales as readonly string[]).includes(locale)
    ? locale
    : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../../messages/${safeLocale}.json`)).default,
  };
});
