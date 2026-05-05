import { type Elysia } from 'elysia';
import { createApiLogger } from '@todo/utils/logging';

const apiLogger = createApiLogger({
  service: 'api-bun',
});

/**
 * Redacts sensitive information from objects (deep clone with redaction)
 */
function redact(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = ['password', 'token', 'access_token', 'refreshToken', 'secret'];
  const redacted = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      (redacted as any)[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object') {
      (redacted as any)[key] = redact(obj[key]);
    } else {
      (redacted as any)[key] = obj[key];
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
      const duration = Math.round(end - (_logStart as number));

      apiLogger.info(`${request.method} ${path} ${set.status || 200} - ${duration}ms`, {
        method: request.method,
        path,
        status: set.status || 200,
        duration,
        query: redact(query),
        // We only log body for non-GET requests and small bodies
        body: request.method !== 'GET' && JSON.stringify(body || {}).length < 1000 ? redact(body) : undefined,
      });
    })
    .onError(({ request, error, path, set }) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const status = typeof set.status === 'number' ? set.status : Number(set.status) || 500;

      apiLogger.error(`${request.method} ${path} FAILED - ${errorMessage}`, {
        method: request.method,
        path,
        error: errorMessage,
        stack: status === 500 ? errorStack : undefined,
      });
    });

export { apiLogger as logger };
