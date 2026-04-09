import { cn } from "@/lib/utils";
import { ReportStatus } from "@/types/report";

const STATUS_LABELS: Record<string, string> = {
  draft:     "טיוטה",
  published: "פורסם",
};

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-slate-100 text-slate-600 border-slate-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface StatusBadgeProps {
  status: ReportStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
