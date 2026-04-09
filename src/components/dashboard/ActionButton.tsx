import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  /** from and to hex colours for the linear gradient, e.g. ["#34d399", "#059669"] */
  colors: [string, string];
  /** rgba shadow colour, e.g. "rgba(5,150,105,0.35)" */
  shadow: string;
  /** Use dark text/icon instead of white (for light-shade cards) */
  darkText?: boolean;
  className?: string;
}

export function ActionButton({
  label,
  description,
  href,
  icon: Icon,
  colors,
  shadow,
  darkText = false,
  className,
}: ActionButtonProps) {
  const iconText  = darkText ? "text-current"   : "text-white drop-shadow";
  const iconBg    = darkText ? "bg-black/10"     : "bg-white/20";
  const labelCls  = darkText ? "text-slate-800"  : "text-white";
  const descCls   = darkText ? "text-slate-500"  : "text-white/70";

  return (
    <Link
      href={href}
      style={{
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
        boxShadow: `0 8px 24px -4px ${shadow}`,
      }}
      className={cn(
        "group flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:brightness-105 active:translate-y-0 active:brightness-95",
        className
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110", iconBg)}>
        <Icon className={cn("h-7 w-7", iconText)} />
      </div>
      <div className="text-center">
        <p className={cn("text-sm font-bold leading-tight", labelCls)}>{label}</p>
        {description && (
          <p className={cn("mt-1 text-xs", descCls)}>{description}</p>
        )}
      </div>
    </Link>
  );
}
