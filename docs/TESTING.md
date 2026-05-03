# Testing Strategy

This document outlines the testing strategy for the Todo List Monorepo project.

## Overview

The project employs a comprehensive testing approach with multiple layers:

1. **Unit Tests**: Testing individual components and functions in isolation
2. **Integration Tests**: Testing interactions between components and services
3. **End-to-End (E2E) Tests**: Testing complete user flows from UI to database
4. **Visual Regression Tests**: Ensuring UI components maintain their appearance
5. **Smart Contract Tests**: Verifying the correctness of blockchain contracts

## Test Coverage

All packages and applications aim for 100% test coverage. Coverage reports are generated during test runs and can be viewed locally or on Codecov.

## Running Tests

### Unit and Integration Tests

To run all tests across the monorepo:

```bash
npm test
```

To run tests for a specific package or app:

```bash
npm test --filter=@todo/web
npm test --filter=@todo/api
npm test --filter=@todo/services
```

To run tests with coverage:

```bash
npm test -- --coverage
```

### End-to-End Tests

E2E tests are implemented using Playwright and are located in the `apps/web/e2e` directory.

To run E2E tests:

```bash
cd apps/web
npm run test:e2e
```

To run E2E tests with the Playwright UI:

```bash
cd apps/web
npm run test:e2e:ui
```

### Visual Regression Tests

Visual regression tests are implemented using Storybook and Chromatic. Storybook stories are located in the component directories.

To run Storybook locally:

```bash
cd packages/ui-web
npm run storybook
```

Chromatic tests run automatically on GitHub Actions when changes are pushed to the main branch or when a pull request is opened.

### Smart Contract Tests

Smart contract tests are located in the `apps/smart-contracts/test` directory and use Hardhat to test the smart contracts in a local blockchain environment.

The test structure follows the standard Hardhat testing pattern:

- `apps/smart-contracts/test/TodoList.test.ts` - Tests for the TodoList smart contract

To run smart contract tests:

```bash
cd apps/smart-contracts
npm test
```

To run smart contract tests with coverage:

```bash
cd apps/smart-contracts
npm run coverage
```

To deploy smart contracts to a local or test network:

```bash
cd apps/smart-contracts
npm run deploy
# or for Moonbase Alpha testnet
npm run deploy:moonbase
```

## Test Structure

### Unit and Integration Tests

Unit and integration tests are located in `__tests__` directories adjacent to the code they test. For example:

- `packages/ui-web/__tests__/Button.test.tsx`
- `packages/services/src/todo/__tests__/todoService.test.ts`
- `apps/api/src/models/__tests__/Todo.test.ts`

### End-to-End Tests

E2E tests are located in the `apps/web/e2e` directory and use Playwright to simulate user interactions with the application.

### Visual Regression Tests

Visual regression tests are implemented as Storybook stories located alongside the components they test. For example:

- `packages/ui-web/src/stories/Button.stories.tsx`

### Smart Contract Tests

Smart contract tests are located in the `apps/smart-contracts/test` directory and follow the Hardhat testing pattern. Each contract has its own test file:

- `apps/smart-contracts/test/TodoList.test.ts`

The tests use Hardhat's testing framework with Chai assertions and ethers.js for interacting with the contracts. Tests are organized into describe blocks for different contract features (creation, retrieval, updates, deletion).

## Continuous Integration

Tests run automatically on GitHub Actions when changes are pushed to the main branch or when a pull request is opened. The CI workflow includes:

1. Linting
2. Type checking
3. Unit and integration tests with coverage reporting
4. E2E tests
5. Smart contract tests
6. Visual regression tests with Chromatic

## Test Configuration

Test configuration is shared across the monorepo using the following packages:

- `packages/config-jest`: Jest configuration for unit and integration tests
- `apps/web/playwright.config.ts`: Playwright configuration for E2E tests
- `.github/workflows/ci.yml`: CI workflow configuration
- `.github/workflows/chromatic.yml`: Chromatic workflow configuration

## Mocking

The project uses various mocking strategies:

- **API Mocks**: Using Jest mock functions and MSW (Mock Service Worker)
- **Database Mocks**: Using mongodb-memory-server for MongoDB and redis-mock for Redis
- **Blockchain Mocks**: Using Hardhat for local blockchain testing

## Best Practices

1.  Write tests before or alongside code (TDD/BDD approach)
2.  Keep tests simple and focused on a single behavior
3.  Use descriptive test names that explain the expected behavior
4.  Avoid testing implementation details; focus on behavior
5.  Maintain high test coverage, especially for critical paths
6.  Use the testing pyramid: more unit tests, fewer E2E tests
7.  Keep tests fast and reliable to encourage frequent running
    .get('/todos')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200)
    .expect((res) => {
    expect(res.body.success).toBe(true);
    expect(res.body.data.todos).toEqual([]);
    });
    });

    it('should return todos for authenticated user', async () => {
    // Create test todo
    await request(app.getHttpServer())
    .post('/todos')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
    title: 'Test Todo',
    priority: 'high',
    })
    .expect(201);

        return request(app.getHttpServer())
          .get('/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.todos).toHaveLength(1);
            expect(res.body.data.todos[0].title).toBe('Test Todo');
          });

    });
    });

describe('/todos (POST)', () => {
it('should create a new todo', () => {
const createTodoDto = {
title: 'New Todo',
description: 'Test description',
priority: 'high',
};

      return request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTodoDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.title).toBe(createTodoDto.title);
          expect(res.body.data.completed).toBe(false);
        });
    });

    it('should return 400 for invalid todo data', () => {
      return request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required title
          priority: 'invalid',
        })
        .expect(400);
    });

});
});

````text

### Database Integration Tests

```typescript
// database.integration.spec.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';
import { TodoService } from '../src/todo/todo.service';
import { Todo, TodoSchema } from '../src/todo/schemas/todo.schema';

describe('Database Integration', () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let todoService: TodoService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    const todoModel = mongoConnection.model(Todo.name, TodoSchema);
    todoService = new TodoService(todoModel);
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  it('should create and retrieve todos', async () => {
    const todoData = {
      title: 'Test Todo',
      priority: 'high' as const,
    };

    const userId = '507f1f77bcf86cd799439012';
    const createdTodo = await todoService.create(todoData, userId);

    expect(createdTodo.title).toBe(todoData.title);
    expect(createdTodo.userId).toBe(userId);

    const todos = await todoService.findAll(userId);
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe(todoData.title);
  });
});
````

## 🎭 End-to-End Testing

### Playwright E2E Tests

```typescript
// e2e/todo-app.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Todo App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow user to register and login', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Sign Up');

    // Fill registration form
    await page.fill('[data-testid=name-input]', 'Test User');
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');

    // Submit form
    await page.click('[data-testid=register-button]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('should create and manage todos', async ({ page }) => {
    // Login first
    await loginUser(page);

    // Create new todo
    await page.click('[data-testid=add-todo-button]');
    await page.fill('[data-testid=todo-title-input]', 'Test Todo');
    await page.selectOption('[data-testid=priority-select]', 'high');
    await page.click('[data-testid=save-todo-button]');

    // Verify todo appears in list
    await expect(page.locator('[data-testid=todo-item]')).toContainText('Test Todo');

    // Mark todo as complete
    await page.click('[data-testid=todo-checkbox]');
    await expect(page.locator('[data-testid=todo-item]')).toHaveClass(/completed/);

    // Delete todo
    await page.click('[data-testid=delete-todo-button]');
    await page.click('[data-testid=confirm-delete-button]');
    await expect(page.locator('[data-testid=todo-item]')).not.toBeVisible();
  });

  test('should handle blockchain integration', async ({ page }) => {
    await loginUser(page);

    // Create todo with blockchain
    await page.click('[data-testid=add-todo-button]');
    await page.fill('[data-testid=todo-title-input]', 'Blockchain Todo');
    await page.check('[data-testid=blockchain-enabled-checkbox]');
    await page.selectOption('[data-testid=network-select]', 'polygon');
    await page.click('[data-testid=save-todo-button]');

    // Wait for blockchain transaction
    await expect(page.locator('[data-testid=transaction-status]')).toContainText('Pending');
    await expect(page.locator('[data-testid=transaction-status]')).toContainText('Confirmed', { timeout: 30000 });

    // Verify transaction hash is displayed
    await expect(page.locator('[data-testid=transaction-hash]')).toBeVisible();
  });
});

async function loginUser(page) {
  await page.goto('/login');
  await page.fill('[data-testid=email-input]', 'test@example.com');
  await page.fill('[data-testid=password-input]', 'password123');
  await page.click('[data-testid=login-button]');
  await expect(page).toHaveURL('/dashboard');
}
```

### Mobile E2E Tests (Detox)

```typescript
// e2e/todo-mobile.e2e.ts
import { device, expect, element, by } from 'detox';

describe('Todo Mobile App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome screen', async () => {
    await expect(element(by.text('Welcome to Todo App'))).toBeVisible();
  });

  it('should allow user registration', async () => {
    await element(by.id('register-button')).tap();

    await element(by.id('name-input')).typeText('Test User');
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');

    await element(by.id('submit-register-button')).tap();

    await expect(element(by.text('Registration successful'))).toBeVisible();
  });

  it('should create and manage todos', async () => {
    // Login first
    await loginUser();

    // Create todo
    await element(by.id('add-todo-fab')).tap();
    await element(by.id('todo-title-input')).typeText('Mobile Todo');
    await element(by.id('priority-picker')).tap();
    await element(by.text('High')).tap();
    await element(by.id('save-todo-button')).tap();

    // Verify todo in list
    await expect(element(by.text('Mobile Todo'))).toBeVisible();

    // Toggle completion
    await element(by.id('todo-checkbox')).tap();
    await expect(element(by.id('todo-item'))).toHaveValue('completed');
  });
});

async function loginUser() {
  await element(by.id('email-input')).typeText('test@example.com');
  await element(by.id('password-input')).typeText('password123');
  await element(by.id('login-button')).tap();
  await expect(element(by.text('Dashboard'))).toBeVisible();
}
```

## ⛓️ Blockchain Testing

### Smart Contract Testing (Hardhat)

```typescript
// test/TodoContract.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TodoContract } from '../typechain-types';

describe('TodoContract', () => {
  let todoContract: TodoContract;
  let owner: any;
  let user1: any;

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();

    const TodoContractFactory = await ethers.getContractFactory('TodoContract');
    todoContract = await TodoContractFactory.deploy();
    await todoContract.deployed();
  });

  describe('Todo Creation', () => {
    it('should create a new todo', async () => {
      const title = 'Test Todo';
      const description = 'Test Description';

      await expect(todoContract.connect(user1).createTodo(title, description))
        .to.emit(todoContract, 'TodoCreated')
        .withArgs(1, user1.address, title, description);

      const todo = await todoContract.getTodo(1);
      expect(todo.title).to.equal(title);
      expect(todo.description).to.equal(description);
      expect(todo.completed).to.be.false;
      expect(todo.owner).to.equal(user1.address);
    });

    it('should not allow empty title', async () => {
      await expect(todoContract.connect(user1).createTodo('', 'Description')).to.be.revertedWith(
        'Title cannot be empty',
      );
    });
  });

  describe('Todo Management', () => {
    beforeEach(async () => {
      await todoContract.connect(user1).createTodo('Test Todo', 'Description');
    });

    it('should allow owner to complete todo', async () => {
      await expect(todoContract.connect(user1).completeTodo(1))
        .to.emit(todoContract, 'TodoCompleted')
        .withArgs(1, user1.address);

      const todo = await todoContract.getTodo(1);
      expect(todo.completed).to.be.true;
    });

    it('should not allow non-owner to complete todo', async () => {
      await expect(todoContract.connect(owner).completeTodo(1)).to.be.revertedWith('Only owner can modify todo');
    });

    it('should allow owner to delete todo', async () => {
      await expect(todoContract.connect(user1).deleteTodo(1))
        .to.emit(todoContract, 'TodoDeleted')
        .withArgs(1, user1.address);

      await expect(todoContract.getTodo(1)).to.be.revertedWith('Todo does not exist');
    });
  });

  describe('Gas Optimization', () => {
    it('should use reasonable gas for todo creation', async () => {
      const tx = await todoContract.connect(user1).createTodo('Test', 'Description');
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.below(100000);
    });
  });
});
```

### Solana Program Testing

```rust
// tests/todo_program.rs
use anchor_lang::prelude::*;
use anchor_lang::solana_program::test_validator::*;
use todo_program::{TodoProgram, Todo, CreateTodo, UpdateTodo};

#[tokio::test]
async fn test_create_todo() {
    let program = TodoProgram::id();
    let mut context = ProgramTestContext::new().await;

    let user = Keypair::new();
    let todo_account = Keypair::new();

    // Airdrop SOL to user
    context.banks_client
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &context.payer.pubkey(),
                &user.pubkey(),
                1_000_000_000,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        ))
        .await
        .unwrap();

    // Create todo
    let ix = Instruction {
        program_id: program,
        accounts: vec![
            AccountMeta::new(todo_account.pubkey(), true),
            AccountMeta::new(user.pubkey(), true),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
        data: CreateTodo {
            title: "Test Todo".to_string(),
            description: "Test Description".to_string(),
        }.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&user.pubkey()),
        &[&user, &todo_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    // Verify todo was created
    let todo_account_data = context.banks_client
        .get_account(todo_account.pubkey())
        .await
        .unwrap()
        .unwrap();

    let todo: Todo = Todo::try_deserialize(&mut todo_account_data.data.as_slice()).unwrap();
    assert_eq!(todo.title, "Test Todo");
    assert_eq!(todo.description, "Test Description");
    assert_eq!(todo.completed, false);
    assert_eq!(todo.owner, user.pubkey());
}
```

## 🚀 Performance Testing

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Load test'
    - duration: 60
      arrivalRate: 100
      name: 'Stress test'
  variables:
    testEmail: 'test-{{ $randomString() }}@example.com'
    testPassword: 'password123'

scenarios:
  - name: 'User Registration and Todo Management'
    weight: 70
    flow:
      - post:
          url: '/auth/register'
          json:
            name: 'Test User'
            email: '{{ testEmail }}'
            password: '{{ testPassword }}'
          capture:
            - json: '$.data.tokens.accessToken'
              as: 'authToken'
      - post:
          url: '/todos'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          json:
            title: 'Load Test Todo'
            priority: 'medium'
          capture:
            - json: '$.data.id'
              as: 'todoId'
      - get:
          url: '/todos'
          headers:
            Authorization: 'Bearer {{ authToken }}'
      - put:
          url: '/todos/{{ todoId }}'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          json:
            completed: true
      - delete:
          url: '/todos/{{ todoId }}'
          headers:
            Authorization: 'Bearer {{ authToken }}'

  - name: 'Read-only Operations'
    weight: 30
    flow:
      - post:
          url: '/auth/login'
          json:
            email: 'existing@example.com'
            password: 'password123'
          capture:
            - json: '$.data.tokens.accessToken'
              as: 'authToken'
      - get:
          url: '/todos'
          headers:
            Authorization: 'Bearer {{ authToken }}'
      - get:
          url: '/analytics/stats'
          headers:
            Authorization: 'Bearer {{ authToken }}'
```

### Performance Benchmarks

```typescript
// performance/benchmarks.spec.ts
import { performance } from 'perf_hooks';
import { TodoService } from '../src/todo/todo.service';

describe('Performance Benchmarks', () => {
  let todoService: TodoService;

  beforeAll(async () => {
    // Setup test environment
  });

  it('should create 1000 todos within acceptable time', async () => {
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < 1000; i++) {
      promises.push(
        todoService.create(
          {
            title: `Todo ${i}`,
            priority: 'medium',
          },
          'test-user-id',
        ),
      );
    }

    await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle concurrent read operations efficiently', async () => {
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(todoService.findAll('test-user-id'));
    }

    await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });
});
```

## 🔧 Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.interface.ts', '!src/**/*.enum.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testTimeout: 30000,
  maxWorkers: '50%',
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 📊 Test Coverage and Quality

### Coverage Requirements

- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User journeys covered
- **Contract Tests**: 100% function coverage

### Quality Gates

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:contracts
```

## 🛠️ Testing Best Practices

### Test Organization

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Single Responsibility**: One assertion per test
3. **Descriptive Names**: Clear test descriptions
4. **Test Data**: Use factories and fixtures
5. **Cleanup**: Proper test isolation

### Mocking Guidelines

1. **Mock External Dependencies**: APIs, databases, third-party services
2. **Don't Mock What You Own**: Test real implementations
3. **Verify Interactions**: Assert mock calls when relevant
4. **Reset Mocks**: Clean state between tests

### Performance Considerations

1. **Parallel Execution**: Run tests concurrently
2. **Test Databases**: Use in-memory or containerized databases
3. **Selective Testing**: Run relevant tests during development
4. **CI Optimization**: Cache dependencies and artifacts

## 🚨 Debugging Tests

### Common Issues

1. **Flaky Tests**: Non-deterministic behavior
2. **Slow Tests**: Performance bottlenecks
3. **False Positives**: Tests passing when they shouldn't
4. **False Negatives**: Tests failing when they shouldn't

### Debugging Tools

1. **Jest Debug**: `node --inspect-brk node_modules/.bin/jest`
2. **Playwright Debug**: `npx playwright test --debug`
3. **Test Logs**: Comprehensive logging in tests
4. **Screenshots**: Visual debugging for E2E tests

## 📚 Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Hardhat Testing](https://hardhat.org/tutorial/testing-contracts)

### Tools

- [Test Coverage Reports](https://codecov.io/)
- [Visual Regression Testing](https://www.chromatic.com/)
- [Load Testing](https://artillery.io/)
- [Contract Security](https://mythx.io/)

This comprehensive testing guide ensures robust, reliable, and maintainable code across the entire monorepo.
