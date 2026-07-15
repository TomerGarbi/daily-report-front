"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function OfflinePage() {
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      await apiClient.get("/health", {
        skipAuth: true,
        timeout: 5000,
        signal: AbortSignal.timeout(5000),
      });
      // API is back — go home
      window.location.href = "/";
      return;
    } catch {
      // still offline
    } finally {
      setChecking(false);
    }
  };

  // Auto-retry every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkConnection, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-background px-4"
    >
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6 animate-pulse">
            <WifiOff className="h-16 w-16 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            השרת אינו זמין
          </h1>
          <p className="text-muted-foreground">
            לא ניתן להתחבר לשרת כרגע. הדף יתרענן אוטומטית כשהשרת יחזור
            לפעולה.
          </p>
        </div>

        <Button
          onClick={checkConnection}
          disabled={checking}
          size="lg"
          variant="default"
        >
          {checking ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="ml-2 h-4 w-4" />
          )}
          {checking ? "בודק חיבור..." : "בדוק שוב"}
        </Button>

        <p className="text-xs text-muted-foreground/60">
          בודק חיבור אוטומטית כל 30 שניות
        </p>
      </div>
    </div>
  );
}
