# Contributing to UI Web Design System

## Overview

This document outlines the development workflow, contribution guidelines, and best practices for the `@todo/ui-web` design system.

## Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- Git
- VS Code (recommended)

### Initial Setup

1. **Clone the repository**:

```bash
git clone <repository-url>
cd todo-list-turborepo
```

2. **Install dependencies**:

```bash
pnpm install
```

3. **Start development environment**:

```bash
# Start Storybook for component development
cd packages/ui-web
pnpm run storybook

# Start the web app to test integration
cd ../../apps/web
pnpm run dev
```

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features and components
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates

### Creating a New Component

1. **Create component directory**:

```bash
mkdir packages/ui-web/src/components/NewComponent
```

2. **Component structure**:

```text
NewComponent/
├── NewComponent.tsx      # Main component
├── index.ts             # Exports
├── NewComponent.test.tsx # Unit tests
└── __tests__/           # Additional tests
```

3. **Component template**:

```tsx
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from '../../utils';
import { cn } from '../../utils';

const newComponentVariants = cva(
  // Base styles
  'base-class',
  {
    variants: {
      variant: {
        default: 'default-styles',
        secondary: 'secondary-styles',
      },
      size: {
        sm: 'small-styles',
        md: 'medium-styles',
        lg: 'large-styles',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface NewComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof newComponentVariants> {
  // Additional props
}

export const NewComponent = forwardRef<HTMLDivElement, NewComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <div ref={ref} className={cn(newComponentVariants({ variant, size }), className)} {...props} />;
  },
);

NewComponent.displayName = 'NewComponent';
```

4. **Export from index**:

```tsx
// packages/ui-web/src/components/NewComponent/index.ts
export { NewComponent, type NewComponentProps } from './NewComponent';

// packages/ui-web/src/index.ts
export { NewComponent, type NewComponentProps } from './components/NewComponent';
```

### Writing Tests

#### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from './NewComponent';

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent>Test content</NewComponent>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<NewComponent variant="secondary">Test</NewComponent>);
    expect(screen.getByText('Test')).toHaveClass('secondary-styles');
  });
});
```

#### Accessibility Tests

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<NewComponent>Test</NewComponent>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Creating Storybook Stories

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from './NewComponent';

const meta: Meta<typeof NewComponent> = {
  title: 'Components/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default component',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary variant',
  },
};
```

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Export component props interfaces
- Use proper generic constraints
- Document complex types

```tsx
// Good
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

// Avoid
interface ButtonProps {
  variant?: string;
  size?: string;
  onClick?: any;
}
```

### Styling

- Use CVA (Class Variance Authority) for component variants
- Follow design token naming conventions
- Maintain consistent spacing and sizing scales
- Support both light and dark themes

```tsx
// Good - semantic tokens
const buttonVariants = cva('inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors', {
  variants: {
    variant: {
      primary: 'bg-primary-500 text-primary-foreground hover:bg-primary-600',
      secondary: 'bg-secondary-100 text-secondary-foreground hover:bg-secondary-200',
    },
  },
});

// Avoid - hardcoded values
const buttonVariants = cva('inline-flex items-center justify-center rounded-md text-sm font-medium', {
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    },
  },
});
```

### Accessibility

- Include proper ARIA attributes
- Support keyboard navigation
- Provide screen reader support
- Test with accessibility tools

```tsx
// Good
<button
  ref={ref}
  type="button"
  aria-pressed={pressed}
  aria-disabled={disabled}
  className={cn(buttonVariants({ variant, size }), className)}
  {...props}
>
  {children}
</button>

// Avoid
<div
  className="button-like"
  onClick={onClick}
>
  {children}
</div>
```

## Testing Requirements

### Test Coverage

Maintain minimum test coverage:

- Unit tests: 80%
- Integration tests: 60%
- Accessibility tests: 100% of interactive components

### Test Types

1. **Unit Tests**: Component behavior and props
2. **Integration Tests**: Component interactions
3. **Accessibility Tests**: ARIA compliance and keyboard navigation
4. **Visual Tests**: Storybook + Chromatic
5. **Performance Tests**: Render time and bundle size

### Running Tests

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage

# Visual regression tests
pnpm run chromatic

# Accessibility tests
pnpm run test-storybook
```

## Documentation

### Component Documentation

Each component should include:

1. **README.md**: Overview and basic usage
2. **Storybook stories**: Interactive examples
3. **Props documentation**: TypeScript interfaces
4. **Accessibility notes**: Keyboard shortcuts and ARIA usage

### Documentation Standards

- Use clear, concise language
- Include code examples
- Document all props and variants
- Provide accessibility guidance
- Include migration notes for breaking changes

## Design Token Management

### Adding New Tokens

1. **Define in token files**:

```tsx
// packages/ui-web/src/tokens/colors.ts
export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a',
  },
};
```

2. **Update CSS variables**:

```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;
}
```

3. **Document in Storybook**:

```tsx
// Add to token explorer story
```

### Token Naming Convention

- Use semantic names: `primary`, `secondary`, `success`, `error`
- Follow scale: `50`, `100`, `200`, ..., `900`
- Be consistent across token types

## Release Process

### Versioning

Follow semantic versioning (semver):

- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Build and test package
- [ ] Create release notes
- [ ] Tag release in Git
- [ ] Publish to npm registry

### Breaking Changes

When introducing breaking changes:

1. **Document migration path**
2. **Provide deprecation warnings**
3. **Update migration guide**
4. **Communicate to consumers**

## Performance Guidelines

### Bundle Size

- Keep component bundle size minimal
- Use tree-shaking friendly exports
- Avoid large dependencies
- Monitor bundle impact

### Runtime Performance

- Minimize re-renders
- Use React.memo for expensive components
- Optimize event handlers
- Profile component performance

## Code Review Process

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] Accessibility requirements met
- [ ] Performance impact assessed
- [ ] Breaking changes documented

### Review Guidelines

1. **Be constructive**: Suggest improvements, don't just point out issues
2. **Focus on code quality**: Maintainability, readability, performance
3. **Check accessibility**: Ensure inclusive design
4. **Verify tests**: Adequate coverage and quality
5. **Consider impact**: Breaking changes, bundle size, performance

## Troubleshooting

### Common Issues

**Build failures**

- Check TypeScript errors
- Verify import paths
- Update dependencies

**Test failures**

- Check test environment setup
- Verify mock configurations
- Update snapshots if needed

**Storybook issues**

- Clear Storybook cache
- Check story configurations
- Verify addon compatibility

**Styling issues**

- Check Tailwind configuration
- Verify CSS import order
- Test in different themes

## Tools and Scripts

### Available Scripts

```bash
# Development
pnpm run dev              # Watch mode build
pnpm run storybook        # Start Storybook

# Testing
pnpm run test             # Run unit tests
pnpm run test:watch       # Watch mode tests
pnpm run test:coverage    # Coverage report
pnpm run test-storybook   # Accessibility tests

# Building
pnpm run build            # Production build
pnpm run type-check       # TypeScript check

# Quality
pnpm run lint             # ESLint
pnpm run format           # Prettier

# Analysis
pnpm run bundle-analyze   # Bundle size analysis
pnpm run chromatic        # Visual regression tests
```

### Development Tools

- **Storybook**: Component development and documentation
- **Vitest**: Unit testing framework
- **Chromatic**: Visual regression testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

## Getting Help

### Resources

- **Storybook**: Component documentation and examples
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Questions and community support
- **Wiki**: Additional documentation and guides

### Communication

- Use GitHub issues for bugs and features
- Join team discussions for questions
- Follow coding standards and conventions
- Participate in code reviews

## Contributing Guidelines

### Pull Request Process

1. **Fork the repository**
2. **Create feature branch** from `develop`
3. **Make changes** following guidelines
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit pull request** with clear description

### Commit Messages

Follow conventional commit format:

```text
type(scope): description

feat(button): add loading state variant
fix(input): resolve focus ring issue
docs(readme): update installation guide
```

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

Thank you for contributing to the UI Web Design System!
