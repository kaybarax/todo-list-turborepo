import { logger } from '../plugins/logging';

/**
 * Simple trace decorator for method tracing
 * This provides functional parity with the NestJS Trace decorator.
 */
export function Trace(operationName: string) {
  return function (_target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      logger.debug(`[TRACE] Starting operation: ${operationName}`, {
        operation: operationName,
        method: propertyName,
        args: args.length > 0 ? '[HIDDEN]' : undefined, // Hide args to avoid leaking sensitive info
      });

      try {
        const result = await method.apply(this, args);
        const duration = Math.round(performance.now() - start);
        logger.debug(`[TRACE] Completed operation: ${operationName}`, {
          operation: operationName,
          duration: `${duration}ms`,
        });
        return result;
      } catch (error: any) {
        const duration = Math.round(performance.now() - start);
        logger.error(`[TRACE] Error in operation: ${operationName}`, {
          operation: operationName,
          error: error.message,
          duration: `${duration}ms`,
          stack: error.stack,
        });
        throw error;
      }
    };
  };
}
