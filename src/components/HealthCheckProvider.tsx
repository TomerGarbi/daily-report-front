"use client";

import { useHealthCheck } from "@/hooks/useHealthCheck";

export function HealthCheckProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useHealthCheck();
  return <>{children}</>;
}
