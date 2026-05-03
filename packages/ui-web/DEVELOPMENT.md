# Development Guidelines - @todo/ui-web

This document provides comprehensive guidelines for developing components in the `@todo/ui-web` package, including best practices, conventions, and workflows.

## 🏗️ Architecture Overview

### Foundation Technologies

- **DaisyUI**: Complete CSS component framework as the foundation
- **Tailwind CSS**: Utility-first styling with design tokens
- **Class Variance Authority (CVA)**: Type-safe variant generation
- **TypeScript**: Full type safety with comprehensive interfaces
- **Vite**: Fast build tool and development server
- **Vitest**: Unit and integration testing framework

### Directory Structure

```text
packages/ui-web/
├── lib/                        # Source code (new structure)
│   ├── components/            # Component implementations
│   │   ├── Button/
│   │   │   ├── Button.tsx     # Main component
│   │   │   ├── Button.stories.tsx # Storybook stories
│   │   │   └── index.ts       # Exports
│   │   └── ...
│   ├── utils/                 # Utility functions
│   │   ├── index.ts          # Main utilities (cn function)
│   │   └── __tests__/        # Utility tests
│   ├── styles.css            # Global styles and CSS variables
│   └── index.ts              # Main package exports
├── __tests__/                 # Test files (new structure)
│   ├── components/           # Component unit tests
│   ├── integration/          # Integration tests
│   ├── visual/              # Visual regression tests
│   ├── coverage/            # Coverage-specific tests
│   ├── ci/                  # CI/CD pipeline tests
│   └── __mocks__/           # Test mocks
├── .storybook/              # Storybook configuration
├── showcase/                # Vite showcase application
└── dist/                   # Built output
```

## 🧩 Component Development

### Creating a New Component

Follow these steps to create a new component:

#### 1. Create Component Directory

```bash
mkdir lib/components/ComponentName
cd lib/components/ComponentName
```

#### 2. Component Implementation

Create `ComponentName.tsx` with this structure:

```tsx
import * as React from 'react';
// DaisyUI components use native HTML elements with CSS classes
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

// Define variants using CVA
const componentVariants = cva(
  // Base classes - always applied
  'base-class-1 base-class-2',
  {
    variants: {
      variant: {
        default: 'variant-default-classes',
        secondary: 'variant-secondary-classes',
        // ... other variants
      },
      size: {
        default: 'size-default-classes',
        sm: 'size-small-classes',
        lg: 'size-large-classes',
        // ... other sizes
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// Define component props interface
export interface ComponentNameProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof componentVariants> {
  asChild?: boolean;
  // ... other custom props
}

// Component implementation with forwardRef
const ComponentName = React.forwardRef<HTMLElement, ComponentNameProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'; // or appropriate HTML element

    return <Comp className={cn(componentVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

ComponentName.displayName = 'ComponentName';

export { ComponentName, componentVariants };
```

#### 3. Create Index File

Create `index.ts`:

```tsx
export { ComponentName, componentVariants } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

#### 4. Update Main Exports

Add to `lib/index.ts`:

```tsx
export { ComponentName, componentVariants } from './components/ComponentName';
export type { ComponentNameProps } from './components/ComponentName';
```

### Component Guidelines

#### Radix UI Integration

When a Radix UI primitive exists, use it as the foundation:

```tsx
import * as RadixPrimitive from '@radix-ui/react-primitive-name';

const Component = React.forwardRef<
  React.ElementRef<typeof RadixPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadixPrimitive.Root> & CustomProps
>(({ className, ...props }, ref) => (
  <RadixPrimitive.Root ref={ref} className={cn('base-classes', className)} {...props} />
));
```

#### Styling Conventions

1. **Use Tailwind Classes**: Prefer Tailwind utilities over custom CSS
2. **CSS Variables**: Use CSS variables for theme-able properties
3. **Responsive Design**: Include responsive variants when appropriate
4. **Dark Mode**: Ensure components work in both light and dark themes

```tsx
// Good: Using Tailwind with CSS variables
'bg-background text-foreground border-border';

// Good: Responsive design
'text-sm md:text-base lg:text-lg';

// Good: Dark mode support
'bg-white dark:bg-slate-900';
```

#### TypeScript Best Practices

1. **Extend HTML Attributes**: Always extend appropriate HTML element attributes
2. **Use VariantProps**: Leverage CVA's VariantProps for variant typing
3. **Generic Components**: Use generics for flexible component APIs
4. **Proper Ref Forwarding**: Always forward refs with correct typing

```tsx
// Good: Proper interface extension
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Good: Generic component
interface SelectProps<T> extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
}
```

#### Accessibility Requirements

1. **ARIA Attributes**: Include proper ARIA attributes
2. **Keyboard Navigation**: Support keyboard interaction
3. **Screen Reader Support**: Ensure screen reader compatibility
4. **Focus Management**: Proper focus handling and visual indicators

```tsx
// Good: Accessibility attributes
<button aria-label="Close dialog" aria-expanded={isOpen} aria-controls="dialog-content" onKeyDown={handleKeyDown}>
  Close
</button>
```

## 🧪 Testing Guidelines

### Test Structure

Each component should have comprehensive tests:

```text
__tests__/components/ComponentName.test.tsx
```

### Test Categories

#### 1. Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../../lib/components/ComponentName';

describe('ComponentName', () => {
  it('renders correctly with default props', () => {
    render(<ComponentName>Test content</ComponentName>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(<ComponentName variant="secondary">Test</ComponentName>);
    const element = screen.getByText('Test');
    expect(element).toHaveClass('variant-secondary-classes');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ComponentName ref={ref}>Test</ComponentName>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles events correctly', () => {
    const handleClick = vi.fn();
    render(<ComponentName onClick={handleClick}>Test</ComponentName>);
    fireEvent.click(screen.getByText('Test'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 2. Accessibility Tests

```tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('ComponentName Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ComponentName>Test</ComponentName>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    render(<ComponentName>Test</ComponentName>);
    const element = screen.getByText('Test');
    element.focus();
    expect(element).toHaveFocus();
  });
});
```

#### 3. Visual Regression Tests

Create comprehensive Storybook stories for visual testing:

```tsx
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
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
    children: 'Default Component',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <ComponentName variant="default">Default</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
    </div>
  ),
};
```

### Testing Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run visual regression tests
pnpm test:visual

# Run specific component tests
pnpm vitest run __tests__/components/ComponentName.test.tsx
```

## 📚 Storybook Development

### Story Structure

Each component should have comprehensive Storybook stories:

#### 1. Basic Stories

```tsx
export const Default: Story = {
  args: {
    children: 'Default state',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <ComponentName variant="default">Default</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
    </div>
  ),
};
```

#### 2. Interactive Stories

```tsx
export const Interactive: Story = {
  render: () => {
    const [state, setState] = React.useState(false);
    return (
      <ComponentName onClick={() => setState(!state)} variant={state ? 'active' : 'default'}>
        Click me: {state ? 'Active' : 'Inactive'}
      </ComponentName>
    );
  },
};
```

#### 3. Documentation Stories

```tsx
export const Documentation: Story = {
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates all the features of ComponentName.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <h3>Usage Examples</h3>
      <ComponentName>Basic usage</ComponentName>
      <ComponentName variant="secondary">With variant</ComponentName>
    </div>
  ),
};
```

### Storybook Commands

```bash
# Start Storybook development server
pnpm storybook

# Build Storybook for production
pnpm build-storybook

# Run Chromatic visual tests
pnpm chromatic
```

## 🎨 Styling Guidelines

### CSS Variables

Use CSS variables for theme-able properties:

```css
/* In lib/styles.css */
:root {
  --component-background: hsl(var(--background));
  --component-foreground: hsl(var(--foreground));
  --component-border: hsl(var(--border));
}

.dark {
  --component-background: hsl(var(--background));
  --component-foreground: hsl(var(--foreground));
}
```

### Tailwind Configuration

Extend Tailwind with custom utilities when needed:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'component-bg': 'var(--component-background)',
        'component-fg': 'var(--component-foreground)',
      },
    },
  },
};
```

### Component Styling Patterns

#### 1. Base Styles

```tsx
const componentVariants = cva(
  // Base styles - always applied
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      // Variant styles
    },
  },
);
```

#### 2. Responsive Design

```tsx
// Include responsive variants
'text-sm md:text-base lg:text-lg';
'p-2 md:p-4 lg:p-6';
'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
```

#### 3. State Styles

```tsx
// Interactive states
'hover:bg-primary/90 active:bg-primary/95';
'focus:ring-2 focus:ring-primary focus:ring-offset-2';
'disabled:opacity-50 disabled:pointer-events-none';
```

## 🔧 Build and Development

### Development Workflow

1. **Start Development**: `pnpm dev` (builds in watch mode)
2. **Run Storybook**: `pnpm storybook` (component development)
3. **Run Tests**: `pnpm test:watch` (test-driven development)
4. **Run Showcase**: `pnpm showcase:dev` (integration testing)

### Build Process

```bash
# Build the library
pnpm build

# Build Storybook
pnpm build-storybook

# Build showcase
pnpm showcase:build
```

### Code Quality

#### ESLint Configuration

The package uses shared ESLint configuration:

```json
{
  "extends": ["@todo/config-eslint/react"]
}
```

#### TypeScript Configuration

```json
{
  "extends": "@todo/config-ts/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["lib/*"]
    }
  }
}
```

### Pre-commit Hooks

Ensure code quality with pre-commit hooks:

```bash
# Lint and fix
pnpm lint

# Type check
pnpm typecheck

# Run tests
pnpm test

# Format code
pnpm format
```

## 🚀 Performance Guidelines

### Bundle Size Optimization

1. **Tree Shaking**: Ensure proper tree shaking with named exports
2. **Code Splitting**: Use dynamic imports for large components
3. **Dependency Management**: Minimize external dependencies

```tsx
// Good: Named exports for tree shaking
export { Button } from './Button';
export { Card } from './Card';

// Good: Dynamic imports for code splitting
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Runtime Performance

1. **Memoization**: Use React.memo for expensive components
2. **Callback Optimization**: Use useCallback for event handlers
3. **Ref Forwarding**: Proper ref forwarding for DOM access

```tsx
// Good: Memoized component
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});

// Good: Optimized callbacks
const Component = ({ onAction }) => {
  const handleClick = React.useCallback(() => {
    onAction();
  }, [onAction]);

  return <button onClick={handleClick}>Click</button>;
};
```

## 📋 Checklist for New Components

Before submitting a new component, ensure:

### Implementation

- [ ] Component follows naming conventions (PascalCase)
- [ ] Uses Radix UI primitive when available
- [ ] Implements proper TypeScript interfaces
- [ ] Uses CVA for variant management
- [ ] Includes proper ref forwarding
- [ ] Supports `asChild` prop when appropriate

### Styling

- [ ] Uses Tailwind CSS classes
- [ ] Implements CSS variables for theming
- [ ] Supports dark mode
- [ ] Includes responsive variants
- [ ] Follows design system tokens

### Accessibility

- [ ] Includes proper ARIA attributes
- [ ] Supports keyboard navigation
- [ ] Has proper focus management
- [ ] Works with screen readers
- [ ] Passes accessibility tests

### Testing

- [ ] Has comprehensive unit tests
- [ ] Includes accessibility tests
- [ ] Has visual regression tests (Storybook stories)
- [ ] Passes all test suites
- [ ] Achieves required coverage thresholds

### Documentation

- [ ] Has complete Storybook stories
- [ ] Includes usage examples
- [ ] Documents all props and variants
- [ ] Has proper JSDoc comments
- [ ] Updates main package exports

### Quality Assurance

- [ ] Passes ESLint checks
- [ ] Passes TypeScript compilation
- [ ] Has no console errors or warnings
- [ ] Works in both light and dark themes
- [ ] Performs well (no performance regressions)

## 🤝 Code Review Guidelines

### What to Look For

1. **API Design**: Is the component API intuitive and consistent?
2. **Accessibility**: Does it meet accessibility standards?
3. **Performance**: Are there any performance concerns?
4. **Testing**: Is the test coverage comprehensive?
5. **Documentation**: Is the component well documented?

### Review Checklist

- [ ] Component follows established patterns
- [ ] TypeScript types are correct and comprehensive
- [ ] Styling follows design system guidelines
- [ ] Tests cover all functionality and edge cases
- [ ] Storybook stories are comprehensive
- [ ] Documentation is clear and complete
- [ ] No breaking changes to existing APIs
- [ ] Performance impact is acceptable

## 📚 Resources

### Documentation

- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Class Variance Authority](https://cva.style/docs)
- [Storybook Documentation](https://storybook.js.org/docs)

### Tools

- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [TypeScript Hero](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)
- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

### Testing

- [Testing Library Documentation](https://testing-library.com/docs/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Jest Axe Documentation](https://github.com/nickcolley/jest-axe)

This development guide ensures consistent, high-quality component development across the `@todo/ui-web` package.
