"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ShieldAlert,
  ServerCrash,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { reportException } from "@/lib/errorReporter";

interface ErrorInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Read a numeric status code from the thrown Error. We deliberately do NOT
 * parse `error.digest` — Next.js's digest is an opaque server-side id, not
 * an HTTP status; the previous regex-based sniff produced misleading UIs
 * whenever the digest happened to contain three digits.
 */
function getStatus(err: Error & { status?: number; statusCode?: number }): number | undefined {
  return typeof err.status === "number"
    ? err.status
    : typeof err.statusCode === "number"
      ? err.statusCode
      : undefined;
}

function getErrorInfo(
  status: number | undefined,
  t: ReturnType<typeof useTranslations>,
): ErrorInfo {
  switch (status) {
    case 400:
    case 422:
      return {
        title: t("badRequestTitle"),
        description: t("badRequestDescription"),
        icon: <Ban className="h-16 w-16 text-primary" />,
      };
    case 403:
      return {
        title: t("forbiddenTitle"),
        description: t("forbiddenDescription"),
        icon: <ShieldAlert className="h-16 w-16 text-primary" />,
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        title: t("serverTitle"),
        description: t("serverDescription"),
        icon: <ServerCrash className="h-16 w-16 text-primary" />,
      };
    default:
      return {
        title: t("genericTitle"),
        description: t("genericDescription"),
        icon: <AlertTriangle className="h-16 w-16 text-primary" />,
      };
  }
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.page");
  const tRoot = useTranslations("errors");

  useEffect(() => {
    console.error("[App Error]", error);
    const tags: Record<string, string> = { scope: "root" };
    const status = getStatus(error as Error & { status?: number; statusCode?: number });
    if (status !== undefined) tags.status = String(status);
    reportException(error, {
      section: "root",
      tags,
      extra: error.digest ? { digest: error.digest } : undefined,
    });
  }, [error]);

  const status = getStatus(error as Error & { status?: number; statusCode?: number });
  const info = getErrorInfo(status, t);

  return (
    <div
      dir="rtl"
      className="min-h-[80vh] flex items-center justify-center px-4"
    >
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">{info.icon}</div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{info.title}</h1>
          <p className="text-muted-foreground">{info.description}</p>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default" size="lg">
            <RefreshCw className="ml-2 h-4 w-4" />
            {tRoot("retry")}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              {tRoot("home")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
