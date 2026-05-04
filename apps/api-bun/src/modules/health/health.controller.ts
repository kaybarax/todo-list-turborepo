import { Elysia } from 'elysia';
import { healthService } from './health.service';
import { HealthResponseSchema, ReadinessResponseSchema } from '../../schemas/health';
import { config } from '../../config/env';

export const healthController = new Elysia({ prefix: '/health' })
  .get(
    '',
    async () => {
      const health = await healthService.getHealth();

      return {
        ...health,
        telemetry: {
          enabled: !!config.JAEGER_ENDPOINT,
          endpoint: config.JAEGER_ENDPOINT,
          serviceName: process.env.OTEL_SERVICE_NAME || 'todo-api-bun',
        },
      };
    },
    {
      response: {
        200: HealthResponseSchema,
      },
      detail: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
          },
        },
      },
    },
  )
  .get(
    '/ready',
    async () => {
      return healthService.getReadiness();
    },
    {
      response: {
        200: ReadinessResponseSchema,
      },
      detail: {
        tags: ['Health'],
        summary: 'Readiness check',
        responses: {
          200: {
            description: 'Service is ready',
          },
        },
      },
    },
  );
