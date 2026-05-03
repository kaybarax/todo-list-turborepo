# OpenTelemetry Instrumentation

This API includes comprehensive OpenTelemetry instrumentation for distributed tracing, metrics, and observability.

## Features

- **Automatic Instrumentation**: HTTP requests, database queries, and external service calls are automatically traced
- **Custom Tracing**: Service methods are decorated with `@Trace()` for detailed performance monitoring
- **Request Context**: Each HTTP request includes trace context and request IDs
- **Error Tracking**: Exceptions are automatically captured in traces
- **Performance Metrics**: Response times, database query performance, and service method execution times

## Configuration

Set the following environment variables:

```bash
# Enable/disable telemetry
TELEMETRY_ENABLED=true

# OpenTelemetry Collector endpoint
OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Service identification
OTEL_SERVICE_NAME=todo-api
OTEL_SERVICE_VERSION=1.0.0
```

## Local Development Setup

1. Start the development infrastructure:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

   This will start:
   - MongoDB (port 27017)
   - Redis (port 6379)
   - Jaeger UI (port 16686)
   - OpenTelemetry Collector (ports 4317/4318)

1. Access Jaeger UI at http://localhost:16686 to view traces

## Usage

### Automatic Tracing

HTTP requests, database operations, and cache operations are automatically traced.

### Custom Tracing

Use the `@Trace()` decorator on service methods:

```typescript
import { Trace } from '../telemetry/decorators/trace.decorator';

@Injectable()
export class MyService {
  @Trace('MyService.customMethod')
  async customMethod() {
    // This method will be traced
  }
}
```

### Manual Spans

For more complex tracing scenarios:

```typescript
import { TelemetryService } from '../telemetry/telemetry.service';

@Injectable()
export class MyService {
  constructor(private telemetryService: TelemetryService) {}

  async complexOperation() {
    return this.telemetryService.createSpan(
      'complex-operation',
      async () => {
        // Your code here
        return result;
      },
      { customAttribute: 'value' },
    );
  }
}
```

## Trace Context

Each HTTP request includes:

- Request ID (x-request-id header)
- HTTP method, URL, and route
- Response status code and duration
- User agent information
- Error details (if applicable)

## Service Method Tracing

The following services include method-level tracing:

- `TodoService`: All CRUD operations and statistics
- `AuthService`: Authentication and token operations
- `UserService`: User management operations

## Monitoring

### Key Metrics to Monitor

1. **Request Duration**: HTTP request response times
1. **Database Performance**: MongoDB query execution times
1. **Cache Performance**: Redis operation latencies
1. **Error Rates**: Failed requests and exceptions
1. **Service Dependencies**: External service call performance

### Alerts

Consider setting up alerts for:

- High error rates (>5%)
- Slow response times (>2s for 95th percentile)
- Database connection issues
- High memory/CPU usage

## Production Deployment

For production environments:

1. Use a dedicated OpenTelemetry Collector
1. Export traces to your observability platform (Jaeger, Zipkin, etc.)
1. Configure sampling rates to manage trace volume
1. Set up proper retention policies
1. Monitor collector performance and resource usage

## Troubleshooting

### Common Issues

1. **Traces not appearing**: Check OTLP_ENDPOINT configuration
1. **High overhead**: Adjust sampling rates or disable in development
1. **Missing spans**: Ensure services are properly instrumented
1. **Memory issues**: Configure batch processors and memory limits

### Debug Mode

Enable debug logging:

```bash
OTEL_LOG_LEVEL=debug
```

This will output detailed telemetry information to the console.
