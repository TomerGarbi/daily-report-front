"use client";

import { useState, useCallback } from "react";
import { Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RefreshFromDbButtonProps {
  /** Async function that fetches data and updates the section. */
  onRefresh: () => Promise<void>;
  /** Button label. Defaults to "רענן מהמסד". */
  label?: string;
  /** Disable the button (e.g. while the parent is saving). */
  disabled?: boolean;
}

/**
 * Small secondary button that triggers a per-section DB refresh.
 * Shows an inline spinner while the request is in flight and surfaces
 * errors as toast notifications.
 */
export function RefreshFromDbButton({
  onRefresh,
  label = "רענן מהמסד",
  disabled = false,
}: RefreshFromDbButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success("הנתונים עודכנו ממסד הנתונים");
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr.message ?? "שגיאה בטעינת נתונים ממסד הנתונים");
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isRefreshing || disabled}
      className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
    >
      {isRefreshing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Database className="h-3.5 w-3.5" />
      )}
      <span>{isRefreshing ? "טוען…" : label}</span>
    </Button>
  );
}
