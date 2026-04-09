"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import Image from "next/image";
import DailyReportLogo from "@/components/DailyReportLogo";
import { Spinner } from "@/components/Spinner";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values);
      router.replace("/");
    } catch {
      setServerError("שם משתמש או סיסמה שגויים");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logos row */}
        <div className="mb-8 flex items-center justify-between px-1">
          <DailyReportLogo />
          <Image
            src="/images/NogaLogo.png"
            alt="נוגה"
            width={140}
            height={60}
            className="object-contain"
          />
        </div>

        {/* Welcome */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">ברוך הבא</h2>
          <p className="mt-1 text-sm text-muted-foreground">הכנס את פרטי ההתחברות שלך להמשך</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white px-10 py-9 shadow-sm border border-border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">שם משתמש</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="username"
                        placeholder="הכנס שם משתמש"
                        className="h-11 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">סיסמה</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="הכנס סיסמה"
                        className="h-11 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600 text-center">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="mt-1 h-11 w-full text-base font-semibold"
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    מתחבר…
                  </span>
                ) : "כניסה"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

