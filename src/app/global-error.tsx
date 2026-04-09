"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-background px-4"
        >
          <div className="text-center max-w-md space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                שגיאה קריטית
              </h1>
              <p className="text-muted-foreground">
                אירעה שגיאה קריטית באפליקציה. אנא נסה לרענן את הדף.
              </p>
            </div>

            {error.digest && (
              <p className="text-xs text-muted-foreground/60 font-mono">
                Error ID: {error.digest}
              </p>
            )}

            <Button
              onClick={reset}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              רענן את הדף
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
