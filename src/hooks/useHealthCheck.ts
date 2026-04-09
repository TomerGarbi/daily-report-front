"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const HEALTH_INTERVAL = 30_000; // check every 30 seconds
const HEALTH_TIMEOUT = 5_000; // 5 second request timeout

export function useHealthCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Don't health-check while already on the offline page
    if (pathname === "/offline") return;

    const checkHealth = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
        const res = await fetch(`${API_BASE}/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(HEALTH_TIMEOUT),
        });

        if (res.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
          router.push("/offline");
        }
      } catch {
        setIsOnline(false);
        router.push("/offline");
      } finally {
        checkingRef.current = false;
      }
    };

    // Initial health check
    checkHealth();

    // Periodic health checks
    const interval = setInterval(checkHealth, HEALTH_INTERVAL);

    return () => clearInterval(interval);
  }, [pathname, router]);

  return { isOnline };
}
