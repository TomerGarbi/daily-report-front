"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepperNav } from "./StepperNav";
import type { StepperHeaderProps } from "./types";

// ── Component ──────────────────────────────────────────────────────────

export function StepperHeader({
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  meta,
  onMetaChange,
  icon: Icon,
  sections,
  activeSection,
  onSectionChange,
  backLabel = "חזרה",
  onBack,
}: StepperHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 pt-5 pb-3 shadow-sm">
      <div className="w-full">
        {/* ── Top row: icon badge + editable fields + back button ── */}
        <div className="flex items-start gap-3">
          {/* Icon badge */}
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm mt-1">
              <Icon className="h-4 w-4" />
            </div>
          )}

          {/* Editable title / subtitle / meta */}
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            {onTitleChange ? (
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="כותרת…"
                className="w-full bg-transparent text-lg font-bold text-slate-800 placeholder:text-slate-300 outline-none border-b border-transparent hover:border-slate-200 focus:border-orange-400 transition-colors"
              />
            ) : (
              <h1 className="text-lg font-bold text-slate-800 truncate">{title}</h1>
            )}

            {(subtitle !== undefined || onSubtitleChange) && (
              onSubtitleChange ? (
                <textarea
                  value={subtitle ?? ""}
                  onChange={(e) => onSubtitleChange(e.target.value)}
                  placeholder="תיאור קצר…"
                  rows={1}
                  className="w-full bg-transparent resize-none text-sm text-slate-500 placeholder:text-slate-300 outline-none border-b border-transparent hover:border-slate-200 focus:border-orange-400 transition-colors leading-snug"
                />
              ) : (
                <p className="text-sm text-slate-500 truncate">{subtitle}</p>
              )
            )}

            {(meta !== undefined || onMetaChange) && (
              onMetaChange ? (
                <input
                  value={meta ?? ""}
                  onChange={(e) => onMetaChange(e.target.value)}
                  placeholder="שם היוצר…"
                  className="w-full bg-transparent text-xs text-slate-400 placeholder:text-slate-300 outline-none border-b border-transparent hover:border-slate-200 focus:border-orange-400 transition-colors mt-0.5"
                />
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">{meta}</p>
              )
            )}
          </div>

          {/* Back button */}
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-500 hover:text-slate-700 shrink-0 mt-0.5"
              onClick={onBack}
            >
              <ArrowRight className="h-4 w-4" />
              {backLabel}
            </Button>
          )}
        </div>

        {/* ── Section stepper ── */}
        {sections.length > 0 && (
          <div className="mt-4">
            <StepperNav
              sections={sections}
              activeSection={activeSection}
              onSectionChange={onSectionChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
