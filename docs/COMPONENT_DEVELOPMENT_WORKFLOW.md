# Component Development Workflow

This guide outlines the workflow for developing components with DaisyUI foundation and Style Dictionary integration.

## Development Workflow Overview

```text
Design → Tokens → DaisyUI Base → Component → Tests → Documentation → Review
```

1. **Design Definition**: Define component requirements and visual design
2. **Token Creation**: Create or identify required design tokens
3. **DaisyUI Foundation**: Build component using DaisyUI classes
4. **Component Implementation**: Add custom logic and variants
5. **Testing**: Write unit, integration, and visual tests
6. **Documentation**: Create Storybook stories and usage docs
7. **Code Review**: Review implementation and integration

## Component Architecture

### Base Structure

All components follow this structure:

```tsx
// src/components/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

// Define variants using DaisyUI classes
const buttonVariants = cva(
  // Base classes - always applied
  'btn',
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        accent: 'btn-accent',
        ghost: 'btn-ghost',
        link: 'btn-link',
        outline: 'btn-outline',
      },
      size: {
        xs: 'btn-xs',
        sm: 'btn-sm',
        md: '', // default size
        lg: 'btn-lg',
      },
      shape: {
        square: 'btn-square',
        circle: 'btn-circle',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, loading, children, ...props }, ref) => {
    return (
      <button className={buttonVariants({ variant, size, shape, className })} ref={ref} {...props}>
        {loading && <span className="loading loading-spinner loading-sm" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
```

### File Organization

```text
src/components/Button/
├── Button.tsx           # Main component
├── Button.test.tsx      # Unit tests
├── Button.stories.tsx   # Storybook stories
├── index.ts            # Export file
└── README.md           # Component documentation
```

## Step-by-Step Development Process

### 1. Design Analysis

Before coding, analyze the design requirements:

- **Visual Design**: Colors, spacing, typography, states
- **Behavior**: Interactions, animations, accessibility
- **Variants**: Different sizes, colors, styles
- **Responsive**: Mobile, tablet, desktop considerations

### 2. Token Identification

Identify required design tokens:

```json
// Check existing tokens
{
  "color": {
    "primary": { "value": "#3b82f6" },
    "secondary": { "value": "#6b7280" }
  },
  "spacing": {
    "2": { "value": "0.5rem" },
    "4": { "value": "1rem" }
  }
}
```

Create new tokens if needed:

```json
// tokens/semantic/components.json
{
  "component": {
    "button": {
      "minHeight": { "value": "2.5rem" },
      "borderRadius": { "value": "{borderRadius.md}" }
    }
  }
}
```

### 3. DaisyUI Foundation

Start with DaisyUI base classes:

```tsx
// Start with basic DaisyUI component
export function Button({ children }) {
  return <button className="btn btn-primary">{children}</button>;
}
```

### 4. Variant Implementation

Add variants using class-variance-authority:

```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      // Map design variants to DaisyUI classes
    },
    size: {
      sm: 'btn-sm',
      md: '', // default
      lg: 'btn-lg',
    },
  },
});
```

### 5. TypeScript Integration

Add proper TypeScript support:

```tsx
import type { VariantProps } from 'class-variance-authority';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Additional props
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### 6. Accessibility Implementation

Ensure accessibility compliance:

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ loading, disabled, children, ...props }, ref) => {
  return (
    <button ref={ref} disabled={disabled || loading} aria-disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
});
```

## Testing Strategy

### Unit Tests

Test component functionality:

```tsx
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct DaisyUI classes', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-primary');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### DaisyUI Integration Tests

Test DaisyUI class application:

```tsx
// DaisyUI-integration.test.tsx
describe('DaisyUI Integration', () => {
  it('applies correct DaisyUI variant classes', () => {
    const variants = ['primary', 'secondary', 'accent'] as const;

    variants.forEach(variant => {
      const { rerender } = render(<Button variant={variant}>Test</Button>);
      expect(screen.getByRole('button')).toHaveClass(`btn-${variant}`);
    });
  });

  it('combines size and variant classes correctly', () => {
    render(
      <Button variant="primary" size="lg">
        Large Primary
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-primary', 'btn-lg');
  });
});
```

### Visual Regression Tests

Test component appearance across themes:

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    chromatic: {
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
        'todo-light': { theme: 'todo-light' },
        'todo-dark': { theme: 'todo-dark' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="accent">Accent</Button>
      </div>
      <div className="flex gap-2">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>
  ),
};
```

## Documentation Standards

### Storybook Stories

Create comprehensive stories:

```tsx
// Button.stories.tsx
export const Playground: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'ghost', 'link', 'outline'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button leftIcon={<PlusIcon />}>Add Item</Button>
      <Button rightIcon={<ArrowRightIcon />}>Continue</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
```

### Component README

Document usage and examples:

````markdown
# Button Component

A flexible button component built on DaisyUI foundation with Style Dictionary tokens.

## Usage

```tsx
import { Button } from '@todo/ui-web';

function MyComponent() {
  return (
    <Button variant="primary" size="lg" onClick={handleClick}>
      Click me
    </Button>
  );
}
```
````

## Props

| Prop    | Type                                 | Default   | Description          |
| ------- | ------------------------------------ | --------- | -------------------- |
| variant | 'primary' \| 'secondary' \| 'accent' | 'primary' | Button style variant |
| size    | 'xs' \| 'sm' \| 'md' \| 'lg'         | 'md'      | Button size          |
| loading | boolean                              | false     | Show loading spinner |

## Examples

### Basic Usage

```tsx
<Button>Default Button</Button>
<Button variant="secondary">Secondary</Button>
```

### With Loading State

```tsx
<Button loading>Processing...</Button>
```

## Accessibility

- Supports keyboard navigation
- Proper ARIA attributes
- Screen reader compatible
- Focus management

````text

## Code Review Checklist

### DaisyUI Integration
- [ ] Uses DaisyUI base classes (`btn`, `card`, etc.)
- [ ] Follows DaisyUI naming conventions
- [ ] Implements proper variant mapping
- [ ] Maintains theme compatibility

### Style Dictionary Integration
- [ ] Uses design tokens where appropriate
- [ ] Avoids hardcoded values
- [ ] Follows token naming conventions
- [ ] Documents token usage

### Component Quality
- [ ] TypeScript types are complete
- [ ] Props are properly documented
- [ ] Accessibility requirements met
- [ ] Error handling implemented

### Testing Coverage
- [ ] Unit tests cover functionality
- [ ] Integration tests verify DaisyUI classes
- [ ] Visual regression tests included
- [ ] Accessibility tests pass

### Documentation
- [ ] Storybook stories comprehensive
- [ ] README includes usage examples
- [ ] Props are documented
- [ ] Migration notes if applicable

## Best Practices

### Component Design

**✅ Do:**
- Use DaisyUI classes as foundation
- Implement proper TypeScript types
- Follow accessibility guidelines
- Create comprehensive variants
- Document usage patterns

**❌ Don't:**
- Override DaisyUI styles unnecessarily
- Use hardcoded colors or spacing
- Ignore accessibility requirements
- Create overly complex APIs
- Skip documentation

### Styling Approach

**✅ Preferred:**
```tsx
// Use DaisyUI classes
<button className="btn btn-primary btn-lg">

// Use design tokens for custom styles
<div className="p-4" style={{ color: 'var(--color-primary)' }}>
````

**❌ Avoid:**

```tsx
// Hardcoded styles
<button style={{ backgroundColor: '#3b82f6', padding: '12px 24px' }}>

// Custom CSS classes that duplicate DaisyUI
<button className="custom-primary-button">
```

### Variant Management

Use class-variance-authority for consistent variant handling:

```tsx
const componentVariants = cva('base-classes', {
  variants: {
    // Map to DaisyUI classes
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
  },
});
```

### Performance Considerations

- Use `forwardRef` for proper ref forwarding
- Implement proper memoization if needed
- Avoid unnecessary re-renders
- Optimize bundle size

## Migration Guidelines

### From Custom Components

1. **Audit Current Implementation**: Identify custom styles and logic
2. **Map to DaisyUI**: Find equivalent DaisyUI classes
3. **Preserve Functionality**: Maintain existing API where possible
4. **Update Tests**: Adapt tests for new implementation
5. **Document Changes**: Note breaking changes and migration steps

### Breaking Changes

When making breaking changes:

1. **Version Bump**: Follow semantic versioning
2. **Migration Guide**: Provide clear migration instructions
3. **Deprecation Period**: Give users time to migrate
4. **Codemods**: Provide automated migration tools if possible

## Tools and Automation

### Development Scripts

```json
{
  "scripts": {
    "component:create": "plop component",
    "component:test": "vitest run src/components",
    "component:visual": "chromatic --project-token=xxx",
    "component:docs": "storybook build"
  }
}
```

### Component Generator

Use Plop.js for consistent component scaffolding:

```javascript
// plopfile.js
module.exports = function (plop) {
  plop.setGenerator('component', {
    description: 'Create a new component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.tsx',
        templateFile: 'templates/component.hbs',
      },
      // ... other files
    ],
  });
};
```

### VS Code Snippets

Create component snippets:

```json
{
  "DaisyUI Component": {
    "prefix": "dui-component",
    "body": [
      "import { cva, type VariantProps } from 'class-variance-authority';",
      "import { forwardRef } from 'react';",
      "",
      "const ${1:component}Variants = cva(",
      "  '${2:base-class}',",
      "  {",
      "    variants: {",
      "      variant: {",
      "        ${3:primary}: '${4:variant-class}',",
      "      }",
      "    }",
      "  }",
      ");",
      "",
      "export interface ${1:Component}Props",
      "  extends React.${5:HTMLAttributes}<HTML${6:Element}>",
      "    VariantProps<typeof ${1:component}Variants> {}",
      "",
      "export const ${1:Component} = forwardRef<HTML${6:Element}, ${1:Component}Props>(",
      "  ({ className, variant, ...props }, ref) => {",
      "    return (",
      "      <${7:div}",
      "        className={${1:component}Variants({ variant, className })}",
      "        ref={ref}",
      "        {...props}",
      "      />",
      "    );",
      "  }",
      ");",
      "",
      "${1:Component}.displayName = '${1:Component}';"
    ]
  }
}
```

This workflow ensures consistent, high-quality components that leverage DaisyUI's foundation while maintaining flexibility and extensibility.
