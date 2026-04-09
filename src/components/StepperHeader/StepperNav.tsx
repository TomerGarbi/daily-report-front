"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { StepperSection } from "./types";

// ── Props ──────────────────────────────────────────────────────────────

interface StepperNavProps {
  sections: StepperSection[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────

export function StepperNav({
  sections,
  activeSection,
  onSectionChange,
  className,
}: StepperNavProps) {
  return (
    <div className={cn("flex items-center justify-center gap-0", className)}>
      {sections.map((section, idx) => {
        const isActive = section.id === activeSection;
        const Icon = section.icon;
        const isLast = idx === sections.length - 1;

        return (
          <Fragment key={section.id}>
            <button
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-6 py-2",
                "transition-all duration-150 outline-none group",
              )}
            >
              {/* Step circle */}
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors",
                  isActive
                    ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-200"
                    : section.done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-slate-400 group-hover:border-orange-400 group-hover:text-orange-500",
                )}
              >
                {section.done && !isActive ? "✓" : idx + 1}
              </span>

              {/* Label + optional icon */}
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-medium whitespace-nowrap",
                  isActive
                    ? "text-orange-600"
                    : section.done
                      ? "text-emerald-600"
                      : "text-slate-400 group-hover:text-orange-500",
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {section.label}
              </span>
            </button>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-[2rem] rounded-full mb-5",
                  section.done ? "bg-emerald-400" : "bg-slate-200",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
