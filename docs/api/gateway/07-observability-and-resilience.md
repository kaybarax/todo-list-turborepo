# 07 Observability And Resilience

## Observability Goal

A single frontend request should be traceable through:

```text
web/mobile -> api-gateway -> api or api-bun -> MongoDB/Redis
```

The gateway should make backend behavior easier to debug, not harder.

## Request ID

Every request should have a stable request ID.

Policy:

- If client sends `x-request-id`, validate and reuse it.
- Otherwise generate one at the gateway.
- Forward it to upstreams.
- Include it in logs and error responses.

Recommended format:

```text
req_<timestamp>_<random>
```

## Trace Propagation

Forward W3C trace context:

```text
traceparent
tracestate
baggage
```

Gateway should create spans:

```text
gateway.request
gateway.route_match
gateway.auth
gateway.proxy
gateway.graphql
gateway.response_normalize
```

Span attributes:

```text
http.method
http.route
http.status_code
gateway.route_id
gateway.upstream
gateway.upstream_url
gateway.retry_count
gateway.fallback_used
user.id_hash
```

Do not record raw tokens, passwords, signatures, or full request bodies.

## Logs

Use structured JSON logs in production.

Fields:

```text
timestamp
level
message
requestId
traceId
method
path
routeId
upstream
statusCode
durationMs
userIdHash
errorCode
```

Local development can use pretty logs if desired.

## Metrics

Gateway metrics should answer:

- How much traffic is the gateway receiving?
- Which routes are slow?
- Which upstream is failing?
- How many requests are going to NestJS versus Bun?
- Are canaries healthy?
- Are clients seeing more 4xx or 5xx?

Recommended metrics:

```text
gateway_requests_total{route,method,status,upstream}
gateway_request_duration_ms_bucket{route,method,upstream}
gateway_upstream_requests_total{upstream,route,status}
gateway_upstream_duration_ms_bucket{upstream,route}
gateway_upstream_errors_total{upstream,route,error_code}
gateway_rate_limited_total{route,scope}
gateway_auth_failures_total{route,reason}
gateway_fallback_total{route,from_upstream,to_upstream}
```

## Health Endpoints

Gateway endpoints:

```text
GET /api/v1/health
GET /api/v1/health/ready
```

`/health` should report gateway process health.

`/health/ready` should check required upstream readiness:

```json
{
  "status": "ready",
  "service": "todo-api-gateway",
  "upstreams": {
    "nest-api": { "status": "ready", "latencyMs": 12 },
    "bun-api": { "status": "ready", "latencyMs": 8 }
  },
  "timestamp": "2026-05-05T12:00:00.000Z"
}
```

Readiness should fail when a required upstream is unavailable. If a route is fully migrated away from an upstream, that upstream can become optional.

## Resilience Patterns

### Timeouts

Every upstream call must have a timeout. No unbounded fetches.

### Retries

Retry only idempotent operations by default.

### Circuit Breakers

Add after basic gateway is stable.

Circuit states:

- Closed: upstream is healthy.
- Open: upstream is failing; fail fast or fallback.
- Half-open: test limited traffic.

### Bulkheads

Separate limits by upstream and route class:

- Auth
- Todo reads
- Todo writes
- GraphQL
- Health

This prevents one path from consuming all gateway capacity.

### Backpressure

If upstreams are slow, the gateway should:

- Apply timeouts.
- Return 503 with request ID.
- Avoid unbounded queued work.
- Emit metrics.

## Error Normalization

The gateway should preserve upstream status codes unless it is a gateway-generated error.

Gateway-generated examples:

```text
404 route not found
401 auth required
413 payload too large
429 rate limited
502 bad gateway
503 upstream unavailable
504 upstream timeout
```

Error body:

```json
{
  "success": false,
  "error": "Gateway Timeout",
  "message": "Upstream bun-api timed out",
  "statusCode": 504,
  "requestId": "req_...",
  "timestamp": "2026-05-05T12:00:00.000Z"
}
```

## Dashboard Ideas

Jaeger:

- Trace by `x-request-id`
- Compare gateway span duration to upstream span duration
- Inspect failed canary requests

Prometheus/Grafana if added:

- Request rate by route
- P95 and P99 latency by route
- Upstream error rate
- Auth failure spikes
- Rate limit events

## Operational Alerts

Recommended alerts:

- Gateway 5xx rate > 2 percent for 5 minutes.
- Upstream 5xx rate > 5 percent for 5 minutes.
- P95 gateway latency > 1 second for REST reads.
- P95 auth latency > 2 seconds.
- Bun canary error rate > Nest baseline by 2x.
- Readiness failing for required upstream.
