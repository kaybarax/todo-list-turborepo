/**
 * Simple trace decorator for method tracing
 * This is a placeholder implementation for OpenTelemetry tracing
 */
export function Trace(operationName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const isTest = process.env.NODE_ENV === 'test';

      // In a real implementation, this would create OpenTelemetry spans
      if (!isTest) {
        console.log(`[TRACE] Starting operation: ${operationName}`);
      }

      try {
        const result = await method.apply(this, args);
        if (!isTest) {
          console.log(`[TRACE] Completed operation: ${operationName}`);
        }
        return result;
      } catch (error) {
        if (!isTest) {
          console.error(`[TRACE] Error in operation: ${operationName}`, error);
        }
        throw error;
      }
    };
  };
}
