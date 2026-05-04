import { t } from 'elysia';

/**
 * Health check response
 */
export const HealthResponseSchema = t.Object(
  {
    status: t.String(),
    timestamp: t.String({ format: 'date-time' }),
    uptime: t.Number(),
    database: t.Object({
      status: t.String(),
      name: t.Optional(t.String()),
    }),
    cache: t.Object({
      status: t.String(),
      type: t.String(),
    }),
    memory: t.Object({
      rss: t.Number(),
      heapTotal: t.Number(),
      heapUsed: t.Number(),
      external: t.Number(),
      arrayBuffers: t.Optional(t.Number()),
    }),
    version: t.String(),
    telemetry: t.Optional(
      t.Object({
        enabled: t.Boolean(),
        endpoint: t.Optional(t.String()),
        serviceName: t.String(),
      }),
    ),
  },
  {
    description: 'Health check information',
  },
);

/**
 * Readiness check response
 */
export const ReadinessResponseSchema = t.Object(
  {
    status: t.String(),
    timestamp: t.String({ format: 'date-time' }),
    checks: t.Object({
      database: t.Boolean(),
      cache: t.Boolean(),
    }),
  },
  {
    description: 'Readiness check information',
  },
);

export type HealthResponse = typeof HealthResponseSchema.static;
export type ReadinessResponse = typeof ReadinessResponseSchema.static;
