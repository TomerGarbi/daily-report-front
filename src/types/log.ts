export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  _id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  user: string;
  context?: string;
  meta?: Record<string, unknown>;
}

export interface LogListResponse {
  data: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface LogStats {
  total: number;
  byLevel: {
    info: number;
    warn: number;
    error: number;
    debug: number;
  };
  recent: {
    last24Hours: number;
    last7Days: number;
  };
  topContexts: { context: string; count: number }[];
}
