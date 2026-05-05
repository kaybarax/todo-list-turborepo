# Contributing to Todo App

Thank you for your interest in contributing to the Todo App! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

By participating in this project, you agree to follow the collaboration and contribution standards in this guide.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 20+** (see `.nvmrc` for exact version)
- **pnpm 9+** for package management
- **Docker Desktop** for local development
- **Git** for version control
- **VS Code** (recommended) with suggested extensions

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/todo-list-turborepo.git
   cd todo-list-turborepo
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Setup Development Environment**

   ```bash
   # Option 1: Use development container (recommended)
   # Open in VS Code and select "Reopen in Container"

   # Option 2: Local development
   docker compose -f docker-compose.dev.yml up -d
   pnpm db:setup
   ```

4. **Verify Setup**
   ```bash
   pnpm test
   pnpm build
   pnpm dev
   ```

## 📋 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** provided
3. **Provide detailed information** including:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots/logs if applicable

#### Issue Types

- **🐛 Bug Report**: Something isn't working correctly
- **✨ Feature Request**: Suggest a new feature or enhancement
- **📚 Documentation**: Improvements to documentation
- **🔧 Maintenance**: Code refactoring, dependency updates
- **🚀 Performance**: Performance improvements
- **🔒 Security**: Security-related issues (use security@todo-app.com for sensitive issues)

### Submitting Changes

#### 1. Create a Branch

```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description

# Or for documentation
git checkout -b docs/documentation-update
```

#### 2. Make Changes

Follow our coding standards and best practices:

- **Write tests** for new functionality
- **Update documentation** as needed
- **Follow TypeScript strict mode** requirements
- **Use conventional commit messages**
- **Ensure all tests pass**

#### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run linting and formatting
pnpm lint
pnpm format

# Test builds
pnpm build
```

#### 4. Commit Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Examples of good commit messages
git commit -m "feat(api): add user authentication endpoint"
git commit -m "fix(web): resolve todo deletion bug"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(contracts): add polygon contract tests"
```

**Commit Types:**

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

#### 5. Push and Create Pull Request

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub with:

- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Link to related issues** using `Fixes #123` or `Closes #123`
- **Screenshots** for UI changes
- **Testing notes** for reviewers

## 🏗️ Development Guidelines

### Code Style

#### TypeScript

- Use **strict mode** TypeScript
- Prefer **interfaces** over types for object shapes
- Use **explicit return types** for functions
- Avoid `any` type - use proper typing

```typescript
// Good
interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

function createTodo(data: CreateTodoDto): Promise<TodoItem> {
  // implementation
}

// Avoid
function createTodo(data: any): any {
  // implementation
}
```

#### React Components

- Use **functional components** with hooks
- Implement **proper prop types** with TypeScript
- Use **custom hooks** for reusable logic
- Follow **component composition** patterns

```typescript
// Good
interface TodoItemProps {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="todo-item">
      {/* component implementation */}
    </div>
  );
}
```

#### API Development

- Use **NestJS decorators** properly
- Implement **proper validation** with class-validator
- Use **DTOs** for request/response types
- Follow **RESTful conventions**

```typescript
// Good
@Controller('todos')
export class TodoController {
  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createTodoDto: CreateTodoDto): Promise<TodoResponseDto> {
    return this.todoService.create(createTodoDto);
  }
}
```

### Testing Guidelines

#### Unit Tests

- **Test behavior, not implementation**
- Use **descriptive test names**
- Follow **AAA pattern** (Arrange, Act, Assert)
- **Mock external dependencies**

```typescript
describe('TodoService', () => {
  describe('create', () => {
    it('should create a new todo with valid data', async () => {
      // Arrange
      const createTodoDto = { title: 'Test Todo', priority: 'high' };
      const expectedTodo = { id: '1', ...createTodoDto, completed: false };

      // Act
      const result = await todoService.create(createTodoDto);

      // Assert
      expect(result).toEqual(expectedTodo);
    });
  });
});
```

#### Integration Tests

- Test **complete workflows**
- Use **test databases**
- **Clean up** after tests
- Test **error scenarios**

#### E2E Tests

- Test **user journeys**
- Use **page object pattern**
- Test **cross-browser compatibility**
- Include **accessibility testing**

### Documentation

#### Code Documentation

- Use **JSDoc** for functions and classes
- Document **complex business logic**
- Include **usage examples**
- Keep documentation **up to date**

````typescript
/**
 * Creates a new todo item with blockchain integration
 * @param createTodoDto - The todo data to create
 * @param userId - The ID of the user creating the todo
 * @param options - Additional options for blockchain integration
 * @returns Promise resolving to the created todo item
 * @throws {ValidationError} When input data is invalid
 * @throws {BlockchainError} When blockchain transaction fails
 * @example
 * ```typescript
 * const todo = await todoService.create(
 *   { title: 'Learn TypeScript', priority: 'high' },
 *   'user123',
 *   { network: 'polygon' }
 * );
 * ```
 */
async create(
  createTodoDto: CreateTodoDto,
  userId: string,
  options?: BlockchainOptions
): Promise<TodoItem> {
  // implementation
}
````

#### README Updates

- Update **feature lists** when adding functionality
- Include **setup instructions** for new dependencies
- Add **usage examples** for new features
- Update **architecture diagrams** when needed

### Blockchain Development

#### Smart Contracts

- Follow **security best practices**
- Use **established patterns** (OpenZeppelin)
- **Test thoroughly** including edge cases
- **Document gas usage**

```solidity
// Good - Solidity example
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/**
 * @title TodoContract
 * @dev Manages todo items on the blockchain
 */
contract TodoContract is Ownable, ReentrancyGuard {
  // implementation
}
```

#### Rust Programs (Solana)

- Follow **Anchor conventions**
- Use **proper error handling**
- **Optimize for compute units**
- **Test with different scenarios**

```rust
// Good - Rust example
use anchor_lang::prelude::*;

#[program]
pub mod todo_program {
    use super::*;

    /// Creates a new todo item
    pub fn create_todo(
        ctx: Context<CreateTodo>,
        title: String,
        description: String,
    ) -> Result<()> {
        // implementation
    }
}
```

## 🔍 Code Review Process

### For Contributors

1. **Self-review** your changes before submitting
2. **Ensure all tests pass** and coverage is maintained
3. **Update documentation** as needed
4. **Respond promptly** to review feedback
5. **Keep PRs focused** - one feature/fix per PR

### Review Criteria

Reviewers will check for:

- **Functionality**: Does the code work as intended?
- **Tests**: Are there adequate tests with good coverage?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Maintainability**: Is the code readable and maintainable?
- **Documentation**: Is the code properly documented?
- **Standards**: Does it follow our coding standards?

### Review Timeline

- **Initial review**: Within 2-3 business days
- **Follow-up reviews**: Within 1-2 business days
- **Urgent fixes**: Within 24 hours

## 🏷️ Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, backward compatible

### Release Workflow

1. **Feature freeze** for upcoming release
2. **Release candidate** testing
3. **Documentation** updates
4. **Changelog** updates
5. **Version tagging** and release
6. **Deployment** to production

## 🎯 Areas for Contribution

### High Priority

- **Performance optimizations**
- **Security enhancements**
- **Test coverage improvements**
- **Documentation improvements**
- **Accessibility features**

### Medium Priority

- **New blockchain integrations**
- **Mobile app enhancements**
- **Developer experience improvements**
- **Monitoring and observability**
- **Internationalization**

### Good First Issues

Look for issues labeled `good first issue` or `help wanted`:

- **Documentation fixes**
- **Simple bug fixes**
- **Test additions**
- **Code cleanup**
- **Configuration improvements**

## 🛠️ Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode-remote.remote-containers",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "rust-lang.rust-analyzer",
    "ms-vscode.vscode-json"
  ]
}
```

### Useful Commands

```bash
# Development
pnpm dev                    # Start all development servers
pnpm dev:web               # Start web app only
pnpm dev:api               # Start API server only

# Testing
pnpm test                  # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Run tests with coverage

# Building
pnpm build                 # Build all packages
pnpm build:web             # Build web app only
pnpm build:api             # Build API server only

# Linting and Formatting
pnpm lint                  # Run ESLint
pnpm lint:fix              # Fix ESLint issues
pnpm format                # Format code with Prettier

# Database
pnpm db:migrate            # Run database migrations
pnpm db:seed               # Seed database with sample data
pnpm db:reset              # Reset database

# Blockchain
pnpm contracts:compile     # Compile smart contracts
pnpm contracts:test        # Test smart contracts
pnpm contracts:deploy      # Deploy contracts
```

## 📞 Getting Help

### Communication Channels

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: [Join our Discord server](https://discord.gg/todo-app) for real-time chat
- **Email**: dev-team@todo-app.com for private inquiries

### Documentation Resources

- **[API Gateway Architecture](./docs/api/gateway/02-target-architecture.md)**: System design and gateway patterns
- **[Bun + Elysia API Guide](./docs/api/bun-elysia-api-guide.md)**: Bun API technical reference
- **[Testing Guide](./docs/testing/testing-strategy.md)**: Testing strategies and examples
- **[Deployment Guide](./docs/deployment/deployment-guide.md)**: Production deployment instructions

### Mentorship

New contributors can request mentorship:

1. **Comment on an issue** you'd like to work on
2. **Tag @maintainers** for guidance
3. **Join our Discord** for real-time help
4. **Schedule a call** for complex contributions

## 🙏 Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md** file
- **Release notes** for significant contributions
- **Annual contributor report**
- **Special badges** on Discord
- **Swag and rewards** for major contributions

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same [MIT License](./LICENSE) that covers the project.

---

**Thank you for contributing to Todo App!** 🎉

Your contributions help make this project better for everyone. Whether you're fixing a typo, adding a feature, or improving documentation, every contribution is valuable and appreciated.

**Happy coding!** 💻✨
