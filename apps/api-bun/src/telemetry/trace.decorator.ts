import { logger } from '../plugins/logging';

const handledErrorNames = new Set([
  'BadRequestError',
  'UnauthorizedError',
  'ForbiddenError',
  'NotFoundError',
  'ConflictError',
  'CastError',
]);

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      isHandled: handledErrorNames.has(error.name),
    };
  }

  return {
    message: String(error),
    name: 'UnknownError',
    stack: undefined,
    isHandled: false,
  };
}

/**
 * Simple trace decorator for method tracing
 * This provides functional parity with the NestJS Trace decorator.
 */
export function Trace(operationName: string): MethodDecorator {
  const wrap = (method: (...args: unknown[]) => unknown, propertyName: string | symbol) => {
    return async function (this: unknown, ...args: unknown[]) {
      const start = performance.now();
      logger.debug(`[TRACE] Starting operation: ${operationName}`, {
        operation: operationName,
        method: String(propertyName),
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
      } catch (error: unknown) {
        const duration = Math.round(performance.now() - start);
        const errorDetails = getErrorDetails(error);
        const metadata = {
          operation: operationName,
          error: errorDetails.message,
          errorName: errorDetails.name,
          duration: `${duration}ms`,
          stack: errorDetails.isHandled ? undefined : errorDetails.stack,
        };

        if (errorDetails.isHandled) {
          logger.debug(`[TRACE] Handled error in operation: ${operationName}`, metadata);
        } else {
          logger.error(`[TRACE] Error in operation: ${operationName}`, metadata);
        }

        throw error;
      }
    };
  };

  const decorator = function (
    targetOrMethod: unknown,
    propertyNameOrContext: string | symbol | { name?: string | symbol },
    descriptor?: PropertyDescriptor,
  ) {
    if (descriptor) {
      descriptor.value = wrap(descriptor.value, propertyNameOrContext as string | symbol);
      return descriptor;
    }

    if (typeof targetOrMethod === 'function') {
      return wrap(
        targetOrMethod as (...args: unknown[]) => unknown,
        typeof propertyNameOrContext === 'object'
          ? (propertyNameOrContext.name ?? operationName)
          : propertyNameOrContext,
      );
    }

    return undefined;
  };

  return decorator as MethodDecorator;
}
