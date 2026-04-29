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
  status:   z.array(z.enum(reportStatusValues)).default([]), // UI multi-select; converted to single value before API call
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
  onlyMine: z.boolean().default(false),
});

export type ReportsFilterValues = z.input<typeof reportsFilterSchema>;

// ---------------------------------------------------------------------------
// Create / Edit report schema
// ---------------------------------------------------------------------------

const stationStatusValues = ["Active", "Inactive", "Maintenance"] as const;

const stationFuelValues = [
  "gas",
  "diesel",
  "solar",
  "turbine",
  "coal",
  "hydro",
  "wind",
  "nuclear",
  "mazut",
  "methanol",
  "other",
] as const;

const objectIdString = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid ObjectId");

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

  // Optional catalog linkage — set when a row was seeded from /settings/stations.
  stationId:      objectIdString.optional(),
  unitId:         objectIdString.optional(),
  mainFuel:       z.string().max(100).optional(),
  secondaryFuels: z.array(z.string().max(100)).max(10).optional(),
});

export const stationDataSchema = z.record(z.string(), z.array(stationRowSchema).min(1));

/** Per-fuel bucket map. Keys are `StationFuel` values; values are `StationData`. */
const stationFuelKey = z.enum(stationFuelValues);
const fuelBucketSchema = z.record(z.string(), stationDataSchema).refine(
  (obj) => Object.keys(obj).every((k) => stationFuelKey.safeParse(k).success),
  { message: "Unknown fuel key" },
);

// ---------------------------------------------------------------------------
// Forecast schema (mirrors backend)
// ---------------------------------------------------------------------------

const hourString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "פורמט שעה חייב להיות HH:MM");

export const forecastDaySchema = z.object({
  value:           z.number({ error: "תחזית עומס היא שדה חובה" }).nonnegative("ערך לא יכול להיות שלילי"),
  peakHour:        hourString,
  minReserveValue: z.number({ error: "תחזית עומס בשעת רזרבה היא שדה חובה" }).nonnegative("ערך לא יכול להיות שלילי"),
  minReserveHour:  hourString,
});

export const weatherDaySchema = z.object({
  temperatureC: z.number({ error: "טמפרטורה היא שדה חובה" }).min(-50).max(60),
  feelsLikeC:   z.number({ error: "טמפרטורה מורגשת היא שדה חובה" }).min(-50).max(60),
  humidityPct:  z.number({ error: "לחות היא שדה חובה" }).min(0).max(100),
});

const weatherSourceSchema = z.enum(["db", "manual"]);

export const forecastSchema = z.object({
  load: z.object({
    today:    forecastDaySchema,
    tomorrow: forecastDaySchema,
  }),
  weather: z.object({
    region:    z.string().trim().min(1).max(50),
    fetchedAt: z.string().datetime().optional(),
    today:     weatherDaySchema,
    tomorrow:  weatherDaySchema,
    source: z.object({
      today:    weatherSourceSchema,
      tomorrow: weatherSourceSchema,
    }),
  }),
});

export type ForecastValues = z.infer<typeof forecastSchema>;

export const reportContentSchema = z.object({
  private: fuelBucketSchema.optional().default({}),
  iec:     fuelBucketSchema.optional().default({}),
  forecast: forecastSchema.optional(),
});

export const createReportSchema = z.object({
  title:       requiredString("כותרת"),
  description: requiredString("תיאור"),
  status:      z.enum(reportStatusValues, { error: "סטטוס לא חוקי" }),
  content:     reportContentSchema,
});

export type CreateReportValues = z.infer<typeof createReportSchema>;
