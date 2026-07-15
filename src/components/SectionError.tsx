"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ShieldAlert, ServerCrash, Ban } from "lucide-react";
import { reportException } from "@/lib/errorReporter";

/**
 * Extract a status code from an unknown Error, falling back to Next.js's
 * `digest` field (which for our thrown-from-server errors is a plain string,
 * not a status code — we deliberately don't try to parse it).
 */
function getStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const anyErr = err as { status?: unknown; statusCode?: unknown };
  const raw = anyErr.status ?? anyErr.statusCode;
  return typeof raw === "number" ? raw : undefined;
}

function iconFor(status: number | undefined): React.ReactNode {
  if (status === 403) return <ShieldAlert className="h-12 w-12 text-primary" />;
  if (status === 400 || status === 422) return <Ban className="h-12 w-12 text-primary" />;
  if (status !== undefined && status >= 500) return <ServerCrash className="h-12 w-12 text-primary" />;
  return <AlertTriangle className="h-12 w-12 text-primary" />;
}

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  /** i18n key under `errors.sections` describing what failed. */
  sectionKey: string;
}

/**
 * Reusable section-level error UI. Renders inside a route's `error.tsx`
 * boundary so a failure in one section doesn't take down the whole app
 * shell (navbar still works, other tabs still usable).
 */
export function SectionError({ error, reset, sectionKey }: Props) {
  const t = useTranslations("errors");
  const tSections = useTranslations("errors.sections");
  const status = getStatus(error);

  useEffect(() => {
    console.error(`[SectionError:${sectionKey}]`, error);
    const tags: Record<string, string> = { section: sectionKey };
    if (status !== undefined) tags.status = String(status);
    reportException(error, {
      section: sectionKey,
      tags,
      extra: error.digest ? { digest: error.digest } : undefined,
    });
  }, [error, sectionKey, status]);

  return (
    <div dir="rtl" className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">{iconFor(status)}</div>
        </div>
        <h2 className="text-xl font-semibold">{tSections(sectionKey)}</h2>
        {error.message && (
          <p className="text-sm text-muted-foreground">{error.message}</p>
        )}
        {status !== undefined && (
          <p className="text-xs text-muted-foreground/60 font-mono">HTTP {status}</p>
        )}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">ID: {error.digest}</p>
        )}
        <div className="flex justify-center pt-2">
          <Button onClick={reset} variant="default">
            <RefreshCw className="ml-2 h-4 w-4" />
            {t("retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}