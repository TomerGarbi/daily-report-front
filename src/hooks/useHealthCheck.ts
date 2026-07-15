"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

/** Interval when the server is healthy. */
const BASE_INTERVAL_MS = 30_000;
/** Cap for the exponential backoff when the server keeps failing. */
const MAX_INTERVAL_MS = 120_000;
/** Per-request timeout for /health. */
const HEALTH_TIMEOUT = 5_000;

export function useHealthCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Don't health-check while already on the offline page — that page
    // runs its own retry loop.
    if (pathname === "/offline") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let currentDelay = BASE_INTERVAL_MS;
    let failures = 0;

    const schedule = (delay: number): void => {
      if (cancelled) return;
      timer = setTimeout(run, delay);
    };

    const run = async (): Promise<void> => {
      // Skip while the tab is hidden — resuming from background will
      // trigger the visibility listener below.
      if (typeof document !== "undefined" && document.hidden) {
        schedule(currentDelay);
        return;
      }
      if (checkingRef.current) {
        schedule(currentDelay);
        return;
      }
      checkingRef.current = true;

      try {
        await apiClient.get("/health", {
          skipAuth: true,
          timeout: HEALTH_TIMEOUT,
          signal: AbortSignal.timeout(HEALTH_TIMEOUT),
        });
        if (cancelled) return;
        setIsOnline(true);
        failures = 0;
        currentDelay = BASE_INTERVAL_MS;
      } catch {
        if (cancelled) return;
        setIsOnline(false);
        failures += 1;
        // Exponential backoff: 30s → 60s → 120s cap.
        currentDelay = Math.min(BASE_INTERVAL_MS * 2 ** (failures - 1), MAX_INTERVAL_MS);
        router.push("/offline");
      } finally {
        checkingRef.current = false;
        schedule(currentDelay);
      }
    };

    // Kick off immediately on mount / route change.
    run();

    // When the tab becomes visible again, force an immediate re-check.
    const onVisibility = (): void => {
      if (typeof document !== "undefined" && !document.hidden) {
        if (timer) clearTimeout(timer);
        run();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [pathname, router]);

  return { isOnline };
}
