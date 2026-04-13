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

const stationStatusValues = ["Active", "Inactive", "Maintenance"] as const;

export const stationRowSchema = z.object({
  stationNumber:             z.number().int().min(1, "מספר יחידה חייב להיות חיובי"),
  installedCapacity:         z.number().min(0, "יכולת מותקנת לא יכולה להיות שלילית"),
  availableCapacity:         z.number().min(0, "יכולת זמינה לא יכולה להיות שלילית"),
  peakCapacity:              z.number().min(0, "יכולת פסגה לא יכולה להיות שלילית"),
  minReserveCapacity:        z.number().min(0, "יכולת מינימום רזרבה לא יכולה להיות שלילית"),
  secondaryFuelPeakCapacity: z.number().min(0, "יכולת דלק משני לא יכולה להיות שלילית"),
  status:                    z.enum(stationStatusValues, { error: "סטטוס לא חוקי" }),
  startTime:                 z.string().optional(),
  endTime:                   z.string().optional(),
  updatedEndTime:            z.string().optional(),
  notes:                     z.string().optional(),
});

export const stationDataSchema = z.record(z.string(), z.array(stationRowSchema).min(1));

export const reportContentSchema = z.object({
  stationData:   stationDataSchema,
  gasData:       stationDataSchema,
  renewableData: stationDataSchema,
  electricData:  stationDataSchema,
});

export const createReportSchema = z.object({
  title:       requiredString("כותרת"),
  description: z.string().optional(),
  group:       z.string(),
  status:      z.enum(reportStatusValues, { error: "סטטוס לא חוקי" }),
  content:     reportContentSchema,
});

export type CreateReportValues = z.infer<typeof createReportSchema>;
