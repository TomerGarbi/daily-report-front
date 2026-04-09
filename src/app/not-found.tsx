"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-background px-4"
    >
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <FileQuestion className="h-16 w-16 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            הדף לא נמצא
          </h2>
          <p className="text-muted-foreground">
            הדף שחיפשת לא קיים או הועבר למקום אחר.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/">חזרה לדף הבית</Link>
        </Button>
      </div>
    </div>
  );
}
