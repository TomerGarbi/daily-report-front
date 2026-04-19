import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FieldCheckboxProps {
  label: string;
  description?: string;
  error?: string;
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Custom background class for the checkbox (default: "bg-white") */
  bgColor?: string;
}

export function FieldCheckbox({
  label,
  description,
  error,
  checked,
  onCheckedChange,
  disabled,
  required,
  className,
  bgColor = "bg-white",
}: FieldCheckboxProps) {
  const id = React.useId();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-3">
        <CheckboxPrimitive.Root
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          required={required}
          className={cn(
            `flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${bgColor} outline-none`,
            "transition-colors duration-150",
            "focus-visible:ring-2 focus-visible:ring-orange-200",
            "data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500",
            "data-[state=indeterminate]:border-orange-400 data-[state=indeterminate]:bg-orange-400",
            error
              ? "border-rose-400"
              : "border-slate-300 hover:border-orange-400",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <CheckboxPrimitive.Indicator>
            {checked === "indeterminate" ? (
              <Minus className="h-3 w-3 text-white" strokeWidth={3} />
            ) : (
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        <div className="flex flex-col gap-0.5">
          <label
            htmlFor={id}
            className={cn(
              "cursor-pointer text-sm font-medium text-slate-700 leading-tight",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
            {required && <span className="ms-0.5 text-orange-500">*</span>}
          </label>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
      </div>

      {error && <p className="ms-8 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
