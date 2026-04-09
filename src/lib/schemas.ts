import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const usernameSchema = z
  .string({ error: "שם משתמש הוא שדה חובה" })
  .min(2, "שם משתמש חייב להכיל לפחות 2 תווים");

export const passwordSchema = z
  .string({ error: "סיסמה היא שדה חובה" })
  .min(6, "סיסמה חייבת להכיל לפחות 6 תווים");

export const emailSchema = z
  .string({ error: "אימייל הוא שדה חובה" })
  .email("כתובת אימייל לא תקינה");

export const requiredString = (label: string) =>
  z.string({ error: `${label} הוא שדה חובה` }).min(1, `${label} הוא שדה חובה`);

export const optionalString = z.string().optional();

export const positiveNumber = (label: string) =>
  z.number({ error: `${label} הוא שדה חובה` }).positive(`${label} חייב להיות מספר חיובי`);

export const dateSchema = z.coerce.date({
  error: "תאריך לא תקין",
});

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Reports filter schema
// ---------------------------------------------------------------------------

export const reportStatusValues = ["draft", "published"] as const;

export const reportsFilterSchema = z.object({
  search:   z.string().optional(),
  status:   z.array(z.enum(reportStatusValues)).default([]),
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
});

export type ReportsFilterValues = z.input<typeof reportsFilterSchema>;

// ---------------------------------------------------------------------------
// Create / Edit report schema
// ---------------------------------------------------------------------------

export const createReportSchema = z.object({
  title:       requiredString("כותרת"),
  description: z.string().optional(),
  group:       z.string(),
  status:      z.enum(reportStatusValues, { error: "סטטוס לא חוקי" }),

  content:     z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try { JSON.parse(val); return true; }
        catch { return false; }
      },
      { message: "תוכן חייב להיות JSON תקין" }
    ),
});

export type CreateReportValues = z.infer<typeof createReportSchema>;
