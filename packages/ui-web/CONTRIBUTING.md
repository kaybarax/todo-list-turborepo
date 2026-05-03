# Contributing to @todo/ui-web

Thank you for your interest in contributing to the `@todo/ui-web` component library! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm**: Version 9.12.0 or higher (required for monorepo management)
- **Git**: For version control

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd todo-list-turborepo
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Build packages**:

   ```bash
   pnpm build:packages
   ```

4. **Start development**:

   ```bash
   # Start the web UI package in development mode
   cd packages/ui-web
   pnpm dev

   # In another terminal, start Storybook
   pnpm storybook
   ```

### Development Workflow

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/component-name
   ```

2. **Make your changes** following the guidelines in [DEVELOPMENT.md](./DEVELOPMENT.md)

3. **Test your changes**:

   ```bash
   pnpm test
   pnpm test:visual
   pnpm lint
   ```

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add new component"
   ```

5. **Push and create a pull request**:
   ```bash
   git push origin feature/component-name
   ```

## 🧩 Types of Contributions

### 1. New Components

We welcome new components that follow our design system and accessibility standards.

#### Before Creating a New Component

- **Check existing components**: Ensure the component doesn't already exist
- **Review design system**: Make sure it fits within our design language
- **Consider reusability**: Components should be generic and reusable
- **Plan the API**: Think about props, variants, and use cases

#### Component Requirements

- **Built on Radix UI**: Use Radix UI primitives when available
- **TypeScript**: Full TypeScript support with proper interfaces
- **Accessibility**: WCAG 2.1 AA compliance
- **Testing**: Comprehensive unit and visual regression tests
- **Documentation**: Complete Storybook stories and examples
- **Responsive**: Works across different screen sizes
- **Themeable**: Supports light and dark modes

### 2. Bug Fixes

Bug fixes are always welcome! Please:

- **Create an issue** first (if one doesn't exist)
- **Include reproduction steps** and expected behavior
- **Add tests** that verify the fix
- **Update documentation** if necessary

### 3. Documentation Improvements

Help us improve our documentation:

- **README updates**: Keep installation and usage instructions current
- **Storybook stories**: Add more examples and use cases
- **Code comments**: Improve JSDoc comments and inline documentation
- **Development guides**: Enhance development and contribution guides

### 4. Performance Improvements

Performance improvements are valuable:

- **Bundle size optimization**: Reduce unnecessary dependencies
- **Runtime performance**: Optimize component rendering
- **Build performance**: Improve build and development speeds
- **Accessibility performance**: Ensure screen reader compatibility

## 📋 Contribution Guidelines

### Code Style

We use automated tools to maintain code quality:

- **ESLint**: For code linting and style enforcement
- **Prettier**: For code formatting
- **TypeScript**: For type checking
- **Husky**: For pre-commit hooks

#### Running Code Quality Checks

```bash
# Lint and fix issues
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format

# Run all quality checks
pnpm quality:check
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

#### Examples

```bash
feat(button): add loading state with spinner
fix(card): resolve padding issue in mobile view
docs(readme): update installation instructions
test(input): add accessibility tests
```

### Pull Request Process

1. **Create a descriptive title** following conventional commit format
2. **Fill out the PR template** with all required information
3. **Link related issues** using keywords (fixes #123, closes #456)
4. **Request reviews** from appropriate team members
5. **Address feedback** promptly and professionally
6. **Ensure CI passes** before requesting final review

#### PR Template

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Visual regression tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

## 🧪 Testing Requirements

All contributions must include appropriate tests:

### Unit Tests

```tsx
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName>Test</ComponentName>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles interactions', () => {
    const handleClick = vi.fn();
    render(<ComponentName onClick={handleClick}>Test</ComponentName>);
    fireEvent.click(screen.getByText('Test'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Accessibility Tests

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<ComponentName>Test</ComponentName>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Visual Regression Tests

```tsx
// ComponentName.stories.tsx
export const VisualTest: Story = {
  render: () => (
    <div className="space-y-4">
      <ComponentName variant="default">Default</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
    </div>
  ),
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run visual regression tests
pnpm test:visual

# Run tests in watch mode
pnpm test:watch
```

## 📚 Documentation Standards

### Component Documentation

Each component should have:

1. **JSDoc comments** with description and examples
2. **Storybook stories** showing all variants and use cases
3. **README examples** demonstrating common usage patterns
4. **TypeScript interfaces** with proper documentation

#### JSDoc Example

````tsx
/**
 * A versatile button component with multiple variants and states.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The visual variant of the button */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** The size of the button */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Text to show when loading */
  loadingText?: string;
}
````

### Storybook Stories

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component built on Radix UI primitives.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants.',
      },
    },
  },
};
```

## 🎨 Design System Guidelines

### Design Tokens

Use design tokens consistently:

```tsx
// Good: Using design tokens
const buttonVariants = cva('inline-flex items-center justify-center rounded-md text-sm font-medium', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
  },
});

// Avoid: Hard-coded values
const styles = {
  backgroundColor: '#3366FF', // Use bg-primary instead
  color: '#FFFFFF', // Use text-primary-foreground instead
};
```

### Accessibility Standards

All components must meet WCAG 2.1 AA standards:

- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard navigation**: All interactive elements must be keyboard accessible
- **Screen readers**: Proper ARIA attributes and semantic HTML
- **Focus management**: Visible focus indicators and logical tab order

### Responsive Design

Components should work across all screen sizes:

```tsx
// Good: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns</Card>
</div>

// Good: Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive heading</h1>
```

## 🔍 Review Process

### Code Review Checklist

Reviewers should check:

- [ ] **Functionality**: Does the code work as expected?
- [ ] **Design consistency**: Does it match our design system?
- [ ] **Accessibility**: Does it meet accessibility standards?
- [ ] **Performance**: Are there any performance concerns?
- [ ] **Testing**: Is test coverage adequate?
- [ ] **Documentation**: Is the component well documented?
- [ ] **TypeScript**: Are types correct and comprehensive?
- [ ] **Breaking changes**: Are breaking changes documented?

### Review Guidelines

#### For Contributors

- **Be responsive**: Address feedback promptly
- **Ask questions**: If feedback is unclear, ask for clarification
- **Test thoroughly**: Ensure your changes work in different scenarios
- **Document changes**: Update documentation as needed

#### For Reviewers

- **Be constructive**: Provide helpful, actionable feedback
- **Explain reasoning**: Help contributors understand the "why"
- **Suggest improvements**: Offer specific suggestions when possible
- **Acknowledge good work**: Recognize quality contributions

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

Before releasing:

- [ ] All tests pass
- [ ] Visual regression tests approved
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped appropriately
- [ ] Breaking changes documented

## 🤝 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- **Be respectful**: Treat all contributors with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that everyone is learning and growing

### Getting Help

If you need help:

1. **Check documentation**: README, DEVELOPMENT.md, and Storybook
2. **Search issues**: Look for existing issues and discussions
3. **Ask questions**: Create an issue with the "question" label
4. **Join discussions**: Participate in community discussions

### Recognition

We value all contributions and will:

- **Credit contributors**: All contributors are listed in releases
- **Highlight contributions**: Significant contributions are highlighted
- **Provide feedback**: Regular feedback on contributions and improvements

## 📞 Contact

For questions or support:

- **Create an issue**: For bugs, features, or questions
- **Start a discussion**: For general questions or ideas
- **Email maintainers**: For private or sensitive matters

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to `@todo/ui-web`! Your contributions help make this library better for everyone. 🎉
