# 05 REST And GraphQL Strategy

## Recommendation

Start with REST proxying as the default gateway behavior.

Add GraphQL as an optional gateway-owned aggregation surface after REST migration is stable.

Do not replace every REST endpoint with GraphQL. Use GraphQL where it removes meaningful frontend complexity.

## Why REST First

The existing API clients in `packages/services` are REST-oriented Axios clients.

Existing endpoints already fit REST well:

- Auth
- Users
- Todos
- Health

The fastest safe migration is:

```text
frontend REST calls -> gateway REST path -> existing upstream REST path
```

This preserves existing contracts while moving routing decisions out of the frontend.

## When GraphQL Helps

GraphQL is worth adding when a screen needs multiple backend calls or flexible field selection.

Good examples:

- Mobile home screen that needs user profile, todo stats, recent todos, and blockchain sync summary.
- Dashboard view that combines todos, blockchain networks, transaction status, and ingestion status.
- Future admin or analytics surface.
- Future clients that need smaller payloads on mobile networks.

Poor examples:

- `POST /auth/login`
- `POST /auth/register`
- `PATCH /todos/:id/toggle`
- Simple CRUD endpoints already used by shared clients

## Recommended Hybrid API Surface

```text
/api/v1/*     REST, stable client contract, proxy or BFF handlers
/graphql      optional GraphQL aggregation endpoint
/api/docs     gateway OpenAPI docs
/graphql/docs optional GraphQL explorer in development only
```

## GraphQL Ownership

The gateway owns the GraphQL schema because GraphQL is a client-facing composition contract.

Resolvers should call:

- Gateway upstream clients
- Existing REST APIs
- Future internal services

Resolvers should not directly write MongoDB for todo/user domain behavior.

## Initial GraphQL Schema Candidate

```graphql
type Query {
  me: User
  todos(filter: TodoFilter, pagination: PaginationInput): TodoConnection!
  todo(id: ID!): Todo
  todoStats: TodoStats!
  dashboard: Dashboard!
}

type Mutation {
  createTodo(input: CreateTodoInput!): Todo!
  updateTodo(id: ID!, input: UpdateTodoInput!): Todo!
  toggleTodo(id: ID!): Todo!
  deleteTodo(id: ID!): DeleteResult!
}

type Dashboard {
  user: User!
  stats: TodoStats!
  recentTodos: [Todo!]!
}
```

## Resolver Pattern

```ts
const resolvers = {
  Query: {
    me: async (_parent, _args, ctx) => {
      return ctx.clients.users.getProfile(ctx.auth);
    },
    dashboard: async (_parent, _args, ctx) => {
      const [user, stats, recentTodos] = await Promise.all([
        ctx.clients.users.getProfile(ctx.auth),
        ctx.clients.todos.getStats(ctx.auth),
        ctx.clients.todos.list({ limit: 5 }, ctx.auth),
      ]);

      return { user, stats, recentTodos };
    },
  },
};
```

## REST Proxy Versus BFF Handler

Use REST proxy when:

- Public route matches upstream route.
- Response shape should remain unchanged.
- No composition is needed.
- Route is part of migration from NestJS to Bun.

Use BFF handler when:

- The frontend needs a shape different from the upstream.
- The handler combines multiple upstreams.
- The handler hides legacy backend differences.
- The handler handles a gateway-specific concern.

## OpenAPI Strategy

The gateway should publish its own OpenAPI document for public REST routes.

There are three practical phases:

### Phase 1: Manual Gateway OpenAPI

Define gateway route docs directly in Elysia route metadata.

Pros:

- Fastest to implement.
- Clear public contract.

Cons:

- Requires manual sync with upstream changes.

### Phase 2: Upstream OpenAPI Import

Use existing scripts:

- `apps/api/scripts/dump-openapi.ts`
- `apps/api-bun/scripts/export-openapi.ts`

Then generate or validate gateway docs from selected upstream paths.

Pros:

- Better drift detection.
- Supports route ownership.

Cons:

- Requires tooling.

### Phase 3: Public Contract Tests

Treat gateway OpenAPI as the contract.

CI checks:

- Gateway OpenAPI exports successfully.
- Upstream route exists for every proxied gateway route.
- Breaking changes require explicit approval.
- Client tests use gateway URL only.

## GraphQL Security

If GraphQL is enabled:

- Disable introspection in production unless behind admin auth.
- Enforce max query depth.
- Enforce max operation complexity.
- Disable arbitrary batching unless rate-limited.
- Prefer persisted queries for mobile once stable.
- Apply the same auth policy as REST.

## Migration Rule

No frontend should call GraphQL because it exists. Add GraphQL only when it improves a real screen or workflow.
