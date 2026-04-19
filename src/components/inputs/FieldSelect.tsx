import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Custom background class for the trigger (default: "bg-white") */
  bgColor?: string;
}

export function FieldSelect({
  label,
  error,
  hint,
  required,
  placeholder = "בחר…",
  options,
  value,
  onValueChange,
  disabled,
  className,
  bgColor = "bg-white",
}: FieldSelectProps) {
  const id = React.useId();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ms-0.5 text-orange-500">*</span>}
        </label>
      )}

      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={id}
          dir="rtl"
          className={cn(
            `flex w-full items-center justify-between rounded-xl border ${bgColor} px-3 py-2.5 text-sm shadow-sm outline-none`,
            "transition-colors duration-150",
            "focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
            error
              ? "border-rose-400 focus:ring-rose-100"
              : "border-slate-200 hover:border-slate-300",
            disabled && "cursor-not-allowed opacity-50",
            !value && "text-slate-400"
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport>
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex cursor-pointer items-center rounded-lg px-8 py-2 text-sm text-slate-700 outline-none",
                    "hover:bg-orange-50 hover:text-orange-700",
                    "data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700",
                    "data-[state=checked]:font-medium"
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="absolute start-2">
                    <Check className="h-4 w-4 text-orange-500" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && <p className="text-xs text-rose-500">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
