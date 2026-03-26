// Workers-compatible logging solution
// Works in both Cloudflare Workers and Node.js environments
//
// UNIFIED REQUEST LOGGING FORMAT:
// All requests are logged on a single line for easy grepping.
// Format: [REQ] id=xxx method=GET path=/foo region=us lang=en status=200 duration=45ms
// Redirects: [REDIRECT] id=xxx from=/foo to=/bar status=302 reason=locale_detection
//
// Debug query params (development only):
// - _debug_from: Original path before redirect chain
// - _debug_rid: Request ID for correlation across redirects

const isDevelopment = process.env.NODE_ENV === 'development';

// Simple color codes for development
const colors = {
  info: '\x1b[36m',    // cyan
  error: '\x1b[31m',   // red
  warn: '\x1b[33m',    // yellow
  debug: '\x1b[90m',   // gray
  reset: '\x1b[0m',
  // Request-specific colors
  req: '\x1b[32m',     // green
  redirect: '\x1b[35m', // magenta
};

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
};

/**
 * Generate a short request ID for correlation
 */
export const generateRequestId = (): string => {
  return crypto.randomUUID().slice(0, 8);
};

/**
 * Format key=value pairs for single-line logging
 * Ensures output is always on one line and greppable
 */
const formatKV = (data: Record<string, any>): string => {
  return Object.entries(data)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      // Escape any values that might break single-line format
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      // Replace newlines and tabs with spaces
      const cleanVal = val.replace(/[\n\r\t]/g, ' ').trim();
      return `${k}=${cleanVal}`;
    })
    .join(' ');
};

// ============================================================================
// UNIFIED REQUEST LOGGING
// ============================================================================

export interface RequestLogData {
  id: string;
  method: string;
  path: string;
  query?: string;
  region?: string;
  lang?: string;
  status?: number;
  duration?: number;
  error?: string;
  // Debug tracking
  debugFrom?: string;
  debugRid?: string;
}

export interface RedirectLogData {
  id: string;
  from: string;
  to: string;
  status: number;
  reason: string;
  // Additional context
  region?: string;
  lang?: string;
  detectedRegion?: string;
  detectedLang?: string;
}

/**
 * Log an incoming request - single line format
 * [REQ:IN] id=xxx method=GET path=/foo query=?bar=1 region=us lang=en
 */
export const logRequestIn = (data: Omit<RequestLogData, 'status' | 'duration'>) => {
  const timestamp = getTimestamp();
  const color = isDevelopment ? colors.req : '';
  const reset = isDevelopment ? colors.reset : '';

  const kv = formatKV({
    id: data.id,
    method: data.method,
    path: data.path,
    query: data.query,
    region: data.region,
    lang: data.lang,
    debug_from: data.debugFrom,
    debug_rid: data.debugRid,
  });

  console.log(`${color}[${timestamp}] [REQ:IN]${reset} ${kv}`);
};

/**
 * Log a completed request - single line format
 * [REQ:OUT] id=xxx method=GET path=/foo status=200 duration=45ms
 */
export const logRequestOut = (data: RequestLogData) => {
  const timestamp = getTimestamp();
  const isError = data.status && data.status >= 400;
  const color = isDevelopment ? (isError ? colors.error : colors.req) : '';
  const reset = isDevelopment ? colors.reset : '';

  const kv = formatKV({
    id: data.id,
    method: data.method,
    path: data.path,
    status: data.status,
    duration: data.duration ? `${data.duration}ms` : undefined,
    error: data.error,
  });

  const logFn = isError ? console.error : console.log;
  logFn(`${color}[${timestamp}] [REQ:OUT]${reset} ${kv}`);
};

/**
 * Log a redirect - single line format with from/to
 * [REDIRECT] id=xxx from=/foo to=/bar status=302 reason=locale_detection region=us->de
 */
export const logRedirect = (data: RedirectLogData) => {
  const timestamp = getTimestamp();
  const color = isDevelopment ? colors.redirect : '';
  const reset = isDevelopment ? colors.reset : '';

  // Format region change if applicable
  let regionChange: string | undefined;
  if (data.region && data.detectedRegion && data.region !== data.detectedRegion) {
    regionChange = `${data.region}->${data.detectedRegion}`;
  }

  const kv = formatKV({
    id: data.id,
    from: data.from,
    to: data.to,
    status: data.status,
    reason: data.reason,
    region: regionChange || data.region,
    lang: data.lang,
  });

  console.log(`${color}[${timestamp}] [REDIRECT]${reset} ${kv}`);
};

// ============================================================================
// DEBUG PARAMS (base64 encoded for cleaner URLs)
// ============================================================================

export interface DebugParams {
  /** Original path before redirect chain started */
  from?: string;
  /** Request ID for correlation */
  rid?: string;
  /** Redirect chain count */
  n?: number;
}

/**
 * Encode debug params to base64 string
 */
const encodeDebugParams = (params: DebugParams): string => {
  try {
    return btoa(JSON.stringify(params));
  } catch {
    return '';
  }
};

/**
 * Decode debug params from base64 string
 */
const decodeDebugParams = (encoded: string): DebugParams => {
  try {
    return JSON.parse(atob(encoded)) as DebugParams;
  } catch {
    return {};
  }
};

/**
 * Extract debug params from URL for redirect chain tracking
 */
export const getDebugParams = (url: URL): { debugFrom?: string; debugRid?: string; debugCount?: number } => {
  if (!isDevelopment) return {};

  const dbg = url.searchParams.get('_dbg');
  if (!dbg) return {};

  const params = decodeDebugParams(dbg);
  return {
    debugFrom: params.from,
    debugRid: params.rid,
    debugCount: params.n,
  };
};

/**
 * Add debug params to a redirect URL (development only)
 * Encodes as single _dbg param with base64 JSON
 */
export const addDebugParams = (
  redirectUrl: string,
  originalPath: string,
  requestId: string,
): string => {
  if (!isDevelopment) return redirectUrl;

  try {
    // Handle relative URLs
    const isRelative = redirectUrl.startsWith('/');
    const url = isRelative
      ? new URL(redirectUrl, 'http://localhost')
      : new URL(redirectUrl);

    // Get existing debug params or create new
    const existingDbg = url.searchParams.get('_dbg');
    const existing = existingDbg ? decodeDebugParams(existingDbg) : {};

    // Build new params - preserve original 'from' if already set
    const params: DebugParams = {
      from: existing.from || originalPath,
      rid: requestId,
      n: (existing.n || 0) + 1,
    };

    url.searchParams.set('_dbg', encodeDebugParams(params));

    return isRelative ? `${url.pathname}${url.search}` : url.toString();
  } catch {
    return redirectUrl;
  }
};

// ============================================================================
// LEGACY LOGGER (kept for backward compatibility)
// ============================================================================

// Format data object for clean output
const formatData = (data: any): string => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data instanceof Error) {
    return `${data.message} ${data.stack || ''}`;
  }

  // Format object with key=value pairs for readability
  const pairs = Object.entries(data)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      if (typeof v === 'object') {
        return `${k}=${JSON.stringify(v)}`;
      }
      return `${k}=${v}`;
    });

  return pairs.length > 0 ? `| ${pairs.join(' ')}` : '';
};

// Base logger implementation
const createBaseLogger = (context?: Record<string, any>) => {
  const log = (level: 'info' | 'error' | 'warn' | 'debug', msg: string, data?: any) => {
    // Skip debug logs in production
    if (level === 'debug' && !isDevelopment) return;

    const timestamp = getTimestamp();
    const color = isDevelopment ? colors[level] : '';
    const reset = isDevelopment ? colors.reset : '';
    const levelStr = level.toUpperCase().padEnd(5);

    // Merge context with data
    const fullData = { ...context, ...data };
    const dataStr = formatData(fullData);

    const message = `${color}[${timestamp}] ${levelStr}${reset} ${msg} ${dataStr}`;

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'debug':
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  };

  return {
    info: (msg: string, data?: any) => log('info', msg, data),
    error: (msg: string, data?: any) => log('error', msg, data),
    warn: (msg: string, data?: any) => log('warn', msg, data),
    debug: (msg: string, data?: any) => log('debug', msg, data),
    child: (childContext: Record<string, any>) => createBaseLogger({ ...context, ...childContext }),
  };
};

// Main logger instance
export const logger = createBaseLogger();

// Helper function to create module-specific loggers
export const createLogger = (moduleName: string) => {
  return createBaseLogger({ module: moduleName });
};

// Request logger helper (legacy - use logRequestIn/logRequestOut for new code)
export const logRequest = (request: Request, additionalContext?: any) => {
  const url = new URL(request.url);
  const requestId = generateRequestId();

  return createBaseLogger({
    req: requestId,
    method: request.method,
    path: url.pathname,
    ...(url.search && { query: url.search }),
    ...additionalContext,
  });
};

export default logger;
