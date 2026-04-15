"use client";

import { UseFormReturn } from "react-hook-form";
import { ReportsFilterValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FieldText, FieldMultiSelect, FieldDatePicker, FieldCheckbox } from "@/components/inputs";
import { Search } from "lucide-react";

interface ReportsFilterBarProps {
  form: UseFormReturn<ReportsFilterValues>;
  onSubmit: (values: ReportsFilterValues) => void;
  onClear: () => void;
}

export function ReportsFilterBar({ form, onSubmit, onClear }: ReportsFilterBarProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* Search */}
        <FormField
          control={form.control}
          name="search"
          render={({ field, fieldState }) => (
            <FormItem className="flex-1 min-w-[180px]">
              <FormControl>
                <FieldText
                  placeholder="חיפוש לפי כותרת…"
                  startIcon={<Search className="h-4 w-4" />}
                  error={fieldState.error?.message}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field, fieldState }) => (
            <FormItem className="w-40">
              <FormControl>
                <FieldMultiSelect
                  placeholder="כל הסטטוסים"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  options={[
                    { value: "draft", label: "טיוטה" },
                    { value: "published", label: "פורסם" },
                  ]}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Date From */}
        <FormField
          control={form.control}
          name="dateFrom"
          render={({ field, fieldState }) => (
            <FormItem className="w-44">
              <FormControl>
                <FieldDatePicker
                  placeholder="מתאריך…"
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(d) =>
                    field.onChange(
                      d
                        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                        : ""
                    )
                  }
                  error={fieldState.error?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Date To */}
        <FormField
          control={form.control}
          name="dateTo"
          render={({ field, fieldState }) => (
            <FormItem className="w-44">
              <FormControl>
                <FieldDatePicker
                  placeholder="עד תאריך…"
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(d) =>
                    field.onChange(
                      d
                        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                        : ""
                    )
                  }
                  error={fieldState.error?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Only mine */}
        <FormField
          control={form.control}
          name="onlyMine"
          render={({ field }) => (
            <FormItem className="flex items-center self-center">
              <FormControl>
                <FieldCheckbox
                  label="הדוחות שלי"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
            חפש
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            className="gap-1.5"
          >
            נקה
          </Button>
        </div>
      </form>
    </Form>
  );
}
