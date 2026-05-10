import { type Elysia } from 'elysia';

const apiLogger = {
  info: (message: string, meta?: unknown) => console.info(message, meta ?? ''),
  warn: (message: string, meta?: unknown) => console.warn(message, meta ?? ''),
  error: (message: string, meta?: unknown) => console.error(message, meta ?? ''),
  debug: (message: string, meta?: unknown) => console.debug(message, meta ?? ''),
};

/**
 * Redacts sensitive information from objects (deep clone with redaction)
 */
function redact(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = ['password', 'token', 'access_token', 'refreshToken', 'secret'];
  if (Array.isArray(obj)) {
    return obj.map(item => redact(item));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      redacted[key] = redact(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Logging plugin for Elysia
 */
export const logging = (app: Elysia) =>
  app
    .derive(() => {
      const start = performance.now();
      return {
        _logStart: start,
      };
    })
    .onAfterHandle(({ request, set, _logStart, body, query, path }) => {
      const end = performance.now();
      const duration = Math.round(end - _logStart);
      const status = set.status ?? 200;
      const serializedBody = JSON.stringify(body ?? {});

      apiLogger.info(`${request.method} ${path} ${status} - ${duration}ms`, {
        method: request.method,
        path,
        status,
        duration,
        query: redact(query),
        // We only log body for non-GET requests and small bodies
        body: request.method !== 'GET' && serializedBody.length < 1000 ? redact(body) : undefined,
      });
    })
    .onError(({ request, error, path, set }) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const statusValue = typeof set.status === 'number' ? set.status : set.status == null ? 500 : Number(set.status);
      const status = Number.isNaN(statusValue) ? 500 : statusValue;

      apiLogger.error(`${request.method} ${path} FAILED - ${errorMessage}`, {
        method: request.method,
        path,
        error: errorMessage,
        stack: status === 500 ? errorStack : undefined,
      });
    });

export { apiLogger as logger };
