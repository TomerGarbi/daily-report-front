"use client";

import { useEffect } from "react";
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

interface ErrorInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function getErrorInfo(error: Error & { status?: number }): ErrorInfo {
  const status = error.status ?? (error as any).statusCode ?? (error as any).digest?.match?.(/(\d{3})/)?.[1];

  switch (Number(status)) {
    case 400:
      return {
        title: "בקשה שגויה",
        description: "הבקשה שנשלחה אינה תקינה. אנא נסה שוב.",
        icon: <Ban className="h-16 w-16 text-primary" />,
      };
    case 403:
      return {
        title: "אין הרשאה",
        description: "אין לך הרשאות לצפות בתוכן זה.",
        icon: <ShieldAlert className="h-16 w-16 text-primary" />,
      };
    case 500:
      return {
        title: "שגיאת שרת",
        description: "אירעה שגיאה בשרת. הצוות שלנו כבר מטפל בבעיה.",
        icon: <ServerCrash className="h-16 w-16 text-primary" />,
      };
    default:
      return {
        title: "משהו השתבש",
        description: "אירעה שגיאה בלתי צפויה. אנא נסה שוב מאוחר יותר.",
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
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  const info = getErrorInfo(error as Error & { status?: number });

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
            נסה שוב
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              דף הבית
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
