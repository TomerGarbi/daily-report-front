"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface ReportRowActionsProps {
  reportId: string;
  onDelete?: (reportId: string) => void;
}

export function ReportRowActions({ reportId, onDelete }: ReportRowActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
        onClick={() => router.push(`/reports/${reportId}`)}
        title="צפה"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-amber-400 hover:text-amber-600 hover:bg-amber-50"
        onClick={() => router.push(`/reports/${reportId}/edit`)}
        title="ערוך"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
        onClick={() => onDelete?.(reportId)}
        title="מחק"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
