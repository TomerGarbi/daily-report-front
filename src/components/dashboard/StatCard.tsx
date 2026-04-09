import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number | undefined;
  icon?: LucideIcon;
  /** Classes for the icon bubble, e.g. "bg-blue-100 text-blue-600" */
  iconColor?: string;
  /** Accent bar colour class, e.g. "bg-blue-400" */
  accentClass?: string;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "bg-slate-100 text-slate-500",
  accentClass = "bg-slate-300",
  isLoading = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* left accent bar (rtl = right side) */}
      <div className={cn("absolute bottom-0 end-0 top-0 w-1 rounded-e-2xl", accentClass)} />

      {Icon && (
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            iconColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {isLoading ? (
          <div className="mt-1.5 h-7 w-16 animate-pulse rounded-lg bg-muted" />
        ) : (
          <p className="mt-0.5 text-3xl font-bold leading-none tabular-nums">
            {value ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}
