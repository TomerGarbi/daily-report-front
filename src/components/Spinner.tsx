import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional label shown below the spinner */
  label?: string;
  /** Additional wrapper classes */
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

/**
 * Reusable loading spinner.
 *
 * Usage:
 *   <Spinner />
 *   <Spinner size="lg" label="טוען נתונים…" />
 *   <FullPageSpinner label="טוען…" />
 */
export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-orange-500 border-t-transparent",
          sizeClasses[size],
        )}
      />
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  );
}

/**
 * Full-page centered spinner with a subtle backdrop.
 * Use this as the loading state when an entire page is waiting for data.
 */
export function FullPageSpinner({ label = "טוען…" }: { label?: string }) {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}

/**
 * Overlay spinner – renders on top of existing content (position: absolute).
 * Parent must have `position: relative`.
 */
export function OverlaySpinner({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
      <Spinner size="lg" label={label} />
    </div>
  );
}
