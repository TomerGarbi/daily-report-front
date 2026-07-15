/**
 * errorReporter.ts
 *
 * Client-side pluggable error reporting abstraction. Defaults to a no-op —
 * errors are still logged via `console.error` at the call site. To enable
 * an external reporter (Sentry, GlitchTip, etc.), call `setErrorReporter()`
 * with an adapter conforming to `ErrorReporter`.
 *
 * Adapters MUST NOT throw — swallow all errors internally.
 */

export interface ErrorReportContext {
  /** Route or component identifier for grouping. */
  section?: string;
  /** Authenticated username, when known. */
  username?: string;
  /** Free-form tags for the destination system. */
  tags?: Record<string, string>;
  /** Additional structured metadata. */
  extra?: Record<string, unknown>;
}

export interface ErrorReporter {
  captureException(error: unknown, context?: ErrorReportContext): void;
  captureMessage(message: string, context?: ErrorReportContext): void;
}

const noopReporter: ErrorReporter = {
  captureException() {},
  captureMessage() {},
};

let current: ErrorReporter = noopReporter;

export const setErrorReporter = (reporter: ErrorReporter): void => {
  current = reporter;
};

export const getErrorReporter = (): ErrorReporter => current;

/** Safe wrapper — never lets a broken reporter crash the caller. */
export const reportException = (error: unknown, context?: ErrorReportContext): void => {
  try {
    current.captureException(error, context);
  } catch (reporterErr) {
    console.error("[errorReporter] adapter threw:", reporterErr);
  }
};
