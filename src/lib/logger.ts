/**
 * src/lib/logger.ts
 * Structured server-side logger for API routes and services.
 * PII (phone numbers, emails) is automatically masked before logging.
 * In production, replace console.* with a centralized log sink (Axiom, Datadog, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  route?: string;
  method?: string;
  statusCode?: number;
  errorCode?: string;
  requestId?: string;
  timestamp: string;
  [key: string]: unknown;
}

// ─── PII Masking ──────────────────────────────────────────────────────────────
/** Mask Indian mobile numbers: 9876543210 → 98****3210 */
function maskPhone(value: string): string {
  return value.replace(/(\d{2})\d{4,6}(\d{4})/g, '$1****$2');
}

/** Mask email addresses: user@example.com → us**@example.com */
function maskEmail(value: string): string {
  return value.replace(/^(.{2})(.+)(@.+)$/, (_, a, _b, c) => `${a}**${c}`);
}

/** Recursively mask PII fields in any object before logging */
function sanitizeForLog(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[DEEP]';
  if (typeof obj === 'string') {
    // Mask phone-like strings
    if (/^\+?\d{10,15}$/.test(obj.trim())) return maskPhone(obj);
    // Mask emails
    if (/@\w+\.\w+/.test(obj)) return maskEmail(obj);
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(item => sanitizeForLog(item, depth + 1));
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      // Completely suppress high-sensitivity fields
      if (['password', 'token', 'secret', 'key', 'authorization', 'cookie'].some(k => lowerKey.includes(k))) {
        result[key] = '[REDACTED]';
      } else if (['phone', 'mobile', 'address', 'email'].some(k => lowerKey.includes(k))) {
        result[key] = typeof value === 'string' ? maskPhone(maskEmail(value)) : '[MASKED]';
      } else {
        result[key] = sanitizeForLog(value, depth + 1);
      }
    }
    return result;
  }
  return obj;
}

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(level: LogLevel, message: string, context: Partial<LogEntry> = {}): void {
  // Skip debug logs in production
  if (level === 'debug' && process.env.NODE_ENV === 'production') return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const sanitized = sanitizeForLog(entry) as LogEntry;
  const output = JSON.stringify(sanitized);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (message: string, context?: Partial<LogEntry>) => log('debug', message, context),
  info: (message: string, context?: Partial<LogEntry>) => log('info', message, context),
  warn: (message: string, context?: Partial<LogEntry>) => log('warn', message, context),
  error: (message: string, context?: Partial<LogEntry>) => log('error', message, context),

  /** Log an API error — convenience method for route handlers */
  apiError: (
    route: string,
    method: string,
    err: unknown,
    extras?: Partial<LogEntry>,
  ) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log('error', 'API error', {
      route,
      method,
      internalError: sanitizeForLog(errorMessage),
      ...extras,
    });
  },
};

/** Generate a short random request ID for log correlation */
export function generateRequestId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
