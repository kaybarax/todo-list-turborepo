# Elasticsearch Integration Guide

This document provides guidance on how to use Elasticsearch in the Todo List Monorepo, including structured logging examples.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Index Management](#index-management)
- [Structured Logging](#structured-logging)
- [Search Examples](#search-examples)
- [Performance Considerations](#performance-considerations)

## Overview

Elasticsearch is used in this project for:

1. Full-text search across todo items
2. Storing and analyzing application logs
3. Metrics aggregation and visualization

## Setup

Elasticsearch is configured in the `docker-compose.yml` file and is available at `http://localhost:9200` in development.

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.10.4
  environment:
    - discovery.type=single-node
    - 'ES_JAVA_OPTS=-Xms512m -Xmx512m'
    - xpack.security.enabled=false
  ports:
    - '9200:9200'
```

## Index Management

### Index Versioning

We use index versioning to manage schema changes without downtime:

```typescript
// Example of creating a new index version
async function createNewIndexVersion(client, version) {
  await client.indices.create({
    index: `todos_v${version}`,
    body: {
      mappings: {
        properties: {
          title: { type: 'text' },
          description: { type: 'text' },
          status: { type: 'keyword' },
          priority: { type: 'keyword' },
          dueDate: { type: 'date' },
          tags: { type: 'keyword' },
          userId: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
    },
  });

  // Update alias to point to the new index
  await client.indices.updateAliases({
    body: {
      actions: [
        { remove: { index: '_all', alias: 'todos_latest' } },
        { add: { index: `todos_v${version}`, alias: 'todos_latest' } },
      ],
    },
  });
}
```

## Structured Logging

We use Pino for structured logging, which integrates with Elasticsearch via a transport:

```typescript
// Example of structured logging with Pino
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV,
    service: 'todo-api',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => {
      return { level: label };
    },
  },
});

// Example of logging a todo creation event
function logTodoCreation(todo, userId) {
  logger.info({
    msg: 'Todo created',
    todoId: todo.id,
    userId,
    title: todo.title,
    priority: todo.priority,
    status: todo.status,
    tags: todo.tags,
  });
}

// Example of logging an error
function logError(err, context = {}) {
  logger.error({
    msg: err.message,
    error: {
      type: err.name,
      message: err.message,
      stack: err.stack,
    },
    ...context,
  });
}
```

### Elasticsearch Transport Configuration

```typescript
// Example of configuring Pino with Elasticsearch transport
import pino from 'pino';
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URI || 'http://localhost:9200',
});

const esTransport = pino.transport({
  target: 'pino-elasticsearch',
  options: {
    index: 'logs',
    consistency: 'one',
    node: process.env.ELASTICSEARCH_URI || 'http://localhost:9200',
    'es-version': 8,
    'bulk-size': 200,
    ecs: true,
  },
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  esTransport,
);
```

## Search Examples

### Basic Search

```typescript
// Example of basic search
async function searchTodos(query, userId) {
  const result = await esClient.search({
    index: 'todos_latest',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['title^2', 'description'],
              },
            },
            {
              term: {
                userId,
              },
            },
          ],
        },
      },
      sort: [{ _score: 'desc' }, { updatedAt: 'desc' }],
    },
  });

  return result.hits.hits.map(hit => ({
    ...hit._source,
    score: hit._score,
  }));
}
```

### Filtered Search

```typescript
// Example of filtered search
async function searchTodosWithFilters(query, filters) {
  const filterClauses = [];

  if (filters.status) {
    filterClauses.push({ term: { status: filters.status } });
  }

  if (filters.priority) {
    filterClauses.push({ term: { priority: filters.priority } });
  }

  if (filters.tags && filters.tags.length > 0) {
    filterClauses.push({ terms: { tags: filters.tags } });
  }

  if (filters.dueDate) {
    filterClauses.push({
      range: {
        dueDate: {
          gte: filters.dueDate.from,
          lte: filters.dueDate.to,
        },
      },
    });
  }

  const result = await esClient.search({
    index: 'todos_latest',
    body: {
      query: {
        bool: {
          must: {
            multi_match: {
              query,
              fields: ['title^2', 'description'],
            },
          },
          filter: filterClauses,
        },
      },
    },
  });

  return result.hits.hits.map(hit => ({
    ...hit._source,
    score: hit._score,
  }));
}
```

## Performance Considerations

1. **Bulk Operations**: Use bulk API for batch operations
2. **Pagination**: Always use pagination for search results
3. **Field Selection**: Only request fields you need
4. **Caching**: Consider using Redis to cache common search results
5. **Index Optimization**: Use appropriate settings for refresh interval, number of shards, and replicas

```typescript
// Example of bulk indexing
async function bulkIndexTodos(todos) {
  const operations = todos.flatMap(todo => [{ index: { _index: 'todos_latest', _id: todo.id } }, todo]);

  return await esClient.bulk({ body: operations });
}
```
