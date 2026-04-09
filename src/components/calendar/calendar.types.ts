import { Report } from "@/types/report";

// ─── Display status (UI-only, extends DB status) ─────────────────────────────
export type DisplayStatus = "draft" | "pending" | "published" | "flagged";

export interface CalEvent {
  id: string;
  title: string;
  dateStr: string; // "YYYY-MM-DD"
  time: string;    // "HH:MM"
  status: DisplayStatus;
  author: string;
  category: string;
  reportId?: string;
}

export type ViewMode = "month" | "week" | "day" | "agenda";

// ─── Status meta ─────────────────────────────────────────────────────────────
export const STATUS_META: Record<
  DisplayStatus,
  { label: string; dot: string; badge: string; bg: string }
> = {
  draft:     { label: "טיוטה", dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700",     bg: "bg-amber-50 border-amber-200" },
  pending:   { label: "ממתין", dot: "bg-blue-400",    badge: "bg-blue-100 text-blue-700",       bg: "bg-blue-50 border-blue-200" },
  published: { label: "הושלם", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  flagged:   { label: "מסומן", dot: "bg-rose-500",    badge: "bg-rose-100 text-rose-700",       bg: "bg-rose-50 border-rose-200" },
};

// Only statuses that exist in the DB
export const ALL_STATUSES: DisplayStatus[] = ["draft", "published"];

// ─── Day names & month names (Hebrew) ────────────────────────────────────────
export const DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
export const MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Density heat colour applied to calendar cells */
export function densityClass(n: number) {
  if (n === 0) return "";
  if (n === 1) return "ring-1 ring-inset ring-sky-200 bg-sky-50/40";
  if (n <= 3)  return "ring-1 ring-inset ring-amber-300 bg-amber-50/50";
  return "ring-2 ring-inset ring-rose-400 bg-rose-50/60";
}

/** Safely extract a display string from an unknown value */
function extractString(value: unknown, fallback = "—"): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const k of ["username", "name", "title", "label", "_id", "id"]) {
      if (typeof obj[k] === "string" && obj[k]) return obj[k] as string;
    }
  }
  return String(value) || fallback;
}

/** Convert a Report (from the DB) into a CalEvent for the calendar UI */
export function reportToEvent(r: Report): CalEvent {
  const d = new Date(r.createdAt);
  return {
    id:       r.id,
    title:    extractString(r.title, "ללא כותרת"),
    dateStr:  d.toISOString().slice(0, 10),
    time:     d.toTimeString().slice(0, 5),
    status:   r.status === "published" ? "published" : "draft",
    author:   extractString(r.createdBy as unknown, "—"),
    category: extractString(r.group as unknown, "כללי"),
    reportId: r.id,
  };
}
