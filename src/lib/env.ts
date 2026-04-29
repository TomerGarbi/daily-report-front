/**
 * Runtime-validated environment variables for the frontend.
 *
 * Importing this module fails fast if a required `NEXT_PUBLIC_*` variable
 * is missing or empty. Use `env.API_URL` instead of reading
 * `process.env.NEXT_PUBLIC_API_URL` directly.
 */
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_URL is required")
    .url("NEXT_PUBLIC_API_URL must be a valid URL"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  // Surface every issue at once so devs don't fix one and rerun.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  // Throwing here means dev/build will halt; in production the app would
  // crash on first import — preferable to silent failures hitting the API.
  throw new Error(`Invalid frontend environment configuration:\n${issues}`);
}

export const env = {
  API_URL: parsed.data.NEXT_PUBLIC_API_URL.replace(/\/+$/, ""),
} as const;
