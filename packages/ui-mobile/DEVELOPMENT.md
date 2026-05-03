# Development Guidelines - @todo/ui-mobile

This document provides comprehensive guidelines for developing components in the `@todo/ui-mobile` package, including best practices, conventions, and React Native specific workflows.

## 🏗️ Architecture Overview

### Foundation Technologies

- **UI Kitten**: Production-ready React Native components with Eva Design System
- **Eva Design System**: Comprehensive design system with theming support
- **React Native**: Cross-platform mobile development framework
- **TypeScript**: Full type safety with comprehensive interfaces
- **Jest**: Unit and integration testing framework
- **React Native Testing Library**: Component testing utilities

### Directory Structure

```text
packages/ui-mobile/
├── lib/                        # Source code (new structure)
│   ├── components/            # Component implementations
│   │   ├── Button/
│   │   │   ├── Button.tsx     # Main component
│   │   │   ├── Button.stories.tsx # Storybook stories
│   │   │   └── index.ts       # Exports
│   │   └── ...
│   ├── theme/                 # Theme configuration
│   │   └── index.ts          # Eva Design theme customization
│   └── index.ts              # Main package exports
├── __tests__/                 # Test files (new structure)
│   ├── components/           # Component unit tests
│   ├── ci/                   # CI-specific tests
│   └── __mocks__/           # Test mocks
├── .storybook/              # Storybook configuration
└── dist/                   # Built output
```

## 🧩 Component Development

## 🧾 Custom Implementations Rationale (Phase 0 Artifact)

This section explains why certain components are implemented (or kept) as custom wrappers instead of directly exporting UI Kitten primitives. Every custom implementation must pay for itself in one or more of: Accessibility, Theming Consistency, Cross‑Platform Behavior, Performance, or API Simplification.

### Evaluation Criteria (Decision Matrix)

| Criterion                                                 | Keep Custom | Prefer Wrapper / Deprecate |
| --------------------------------------------------------- | ----------- | -------------------------- |
| Adds cross‑platform logic (layout / animation / focus)    | ✅          | ❌                         |
| Normalizes a11y gaps in base component                    | ✅          | ❌                         |
| Centralizes design tokens (variants / sizes)              | ✅          | ❌                         |
| Removes complexity vs. base API                           | ✅          | ❌                         |
| Only re-exports with minor style tweaks                   | ❌          | ✅                         |
| Duplicates logic that will move to mapping util (Phase 1) | ❌          | ✅                         |

### Modal

Reasoning: We require (a) unified entrance / exit animations with an upcoming reduced‑motion branch (P1-2), (b) future focus trap / return-on-close semantics, (c) token-driven elevation + backdrop styling, and (d) deterministic testability (eliminating arbitrary timeouts – see MOD-3). A thin wrapper around UI Kitten `Modal` would not expose sufficient control hooks. Therefore the custom implementation stays.

Planned Enhancements:

- Integrate `useReducedMotion` (Phase 1) to branch animations.
- Replace magic timeout with animation completion callback (MOD-3).
- Add rationale cross-link in remediation tasks (MOD-1 satisfied by this section).

### TabBar

Reasoning: Needs coordinated indicator + label transition, adaptive layout, upcoming reduced motion path, and accessible roles / state across items (e.g., `accessibilityRole="tab"`, `accessibilityState.selected`). These behaviors exceed a direct pass-through of UI Kitten `BottomNavigation` and allow tighter integration with navigation state. Custom retained.

Planned Enhancements:

- Consume mapping util once introduced (P1-1) for variant/size.
- Add reduced motion branch (TBR-2) and shadows util (P1-3 / TBR-3).

### Header

Reasoning (HDR-3): We intentionally keep a thin custom header instead of directly exporting UI Kitten `TopNavigation` because:

1. Reduced Wrapper Depth: Eliminates intermediate `TopNavigation` container + action wrappers, lowering render tree complexity and cost on navigation transitions.
2. Design Token Control: Direct application of spacing + elevation tokens (shared `getShadow` util) without mapping through Eva abstractions enables tighter convergence with web design system.
3. Accessibility Explicitness: Guarantees `accessibilityRole="header"` and deterministic landmark semantics; `TopNavigation` does not provide role by default in our version.
4. Layout Flexibility: Symmetric left/right slot min touch target sizing (44px) and central truncation logic are simpler to evolve (e.g., animated collapse, dynamic search injection) without upstream constraints.
5. Future Migration Path: If UI Kitten's `TopNavigation` gains needed a11y + layout primitives, we can wrap it internally behind the same API (see P6-3 spike) with no breaking change.

Current State:

- Shadows util integrated (HDR-2) replacing inline shadow object.
- Explicit landmark role + overridable `accessibilityLabel` applied (HDR-1).

Planned Enhancements:

- Storybook documentation of slot patterns (Phase 2) incl. icon buttons, composite breadcrumbs.
- Spike (P6-3) evaluating wrapping `TopNavigation` once parity confirmed.

### ListItem (Candidate for Deprecation)

Current Value: Minimal – largely forwards props with light spacing adjustments.
Assessment: Fails decision matrix (no unique logic; style tweaks only). We will mark as deprecated unless a compelling enhancement (composite layout / accessory alignment / a11y batching) is scheduled before Phase 3.

Deprecation Plan:

1. Mark component with JSDoc `@deprecated` tag now.
2. Add Storybook story banner (`ListItem.deprecated.stories.tsx`) in Phase 2.
3. Remove in first minor release occurring after ≥1 cycle (CHANGELOG entry required).

Suggested JSDoc Banner:

```ts
/**
 * @deprecated Will be removed in a future minor version. Use the base UI Kitten ListItem directly unless
 * forthcoming composite layout enhancements are implemented.
 */
```

### General Policy

- New custom components MUST document rationale in this section (or a linked ADR) before merging.
- If rationale becomes invalid (e.g., UI Kitten adds missing a11y behavior), schedule deprecation.
- Refactors should prefer moving variant/size/status branching into the shared mapping util (P1-1) to reduce per-component duplication.

Status: This section fulfills remediation task P0-4.

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
import React from 'react';
import {
  ComponentName as UIKittenComponent,
  ComponentNameProps as UIKittenComponentProps,
} from '@ui-kitten/components';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Define custom props interface
export interface ComponentNameProps extends Omit<UIKittenComponentProps, 'children'> {
  // Custom props
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  rounded?: boolean;
  loading?: boolean;
  // ... other custom props
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  rounded = false,
  loading = false,
  style,
  ...props
}) => {
  // Map custom variants to UI Kitten status
  const getStatus = (): string => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'basic';
      case 'danger':
        return 'danger';
      case 'success':
        return 'success';
      case 'outline':
        return 'basic';
      case 'ghost':
        return 'basic';
      default:
        return 'basic';
    }
  };

  // Map custom sizes to UI Kitten sizes
  const getSize = (): string => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'medium';
    }
  };

  // Combine styles
  const componentStyle = [fullWidth && styles.fullWidth, rounded && styles.rounded, style];

  return (
    <UIKittenComponent
      status={getStatus()}
      size={getSize()}
      style={componentStyle}
      disabled={loading || props.disabled}
      {...props}
    />
  );
};

// Styles using StyleSheet
const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  rounded: {
    borderRadius: 25,
  },
});
```

#### 3. Create Index File

Create `index.ts`:

```tsx
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

#### 4. Update Main Exports

Add to `lib/index.ts`:

```tsx
export { ComponentName } from './components/ComponentName';
export type { ComponentNameProps } from './components/ComponentName';
```

### Component Guidelines

#### UI Kitten Integration

Always use UI Kitten components as the foundation:

```tsx
import { Button as UIKittenButton, ButtonProps } from '@ui-kitten/components';

// Good: Extending UI Kitten component
export interface CustomButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({ variant, fullWidth, ...props }) => {
  return (
    <UIKittenButton
      status={variant === 'primary' ? 'primary' : 'basic'}
      style={[fullWidth && { width: '100%' }, props.style]}
      {...props}
    />
  );
};
```

#### Styling Conventions

1. **Use StyleSheet**: Always use React Native's StyleSheet for performance
2. **Eva Design Variables**: Use Eva Design theme variables when possible
3. **Platform-Specific Styles**: Include platform-specific styling when needed
4. **Responsive Design**: Consider different screen sizes and orientations

```tsx
import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  // Platform-specific styles
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
```

#### TypeScript Best Practices

1. **Extend UI Kitten Props**: Always extend appropriate UI Kitten component props
2. **Platform Types**: Use React Native specific types
3. **Generic Components**: Use generics for flexible component APIs
4. **Proper Ref Forwarding**: Forward refs with correct typing when needed

```tsx
import { ViewProps, TextProps } from 'react-native';
import { ButtonProps as UIKittenButtonProps } from '@ui-kitten/components';

// Good: Extending React Native and UI Kitten types
interface CustomButtonProps extends UIKittenButtonProps {
  variant?: 'primary' | 'secondary';
  containerStyle?: ViewProps['style'];
  textStyle?: TextProps['style'];
}

// Good: Generic component
interface SelectProps<T> extends ViewProps {
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  onSelect: (option: T) => void;
}
```

#### Accessibility Requirements

1. **Accessibility Labels**: Include proper accessibility labels
2. **Accessibility Hints**: Provide helpful hints for screen readers
3. **Accessibility Roles**: Use appropriate accessibility roles
4. **Touch Targets**: Ensure minimum touch target sizes (44x44 points)

```tsx
// Good: Accessibility attributes
<TouchableOpacity
  accessibilityLabel="Close dialog"
  accessibilityHint="Closes the current dialog"
  accessibilityRole="button"
  style={{ minWidth: 44, minHeight: 44 }}
  onPress={onClose}
>
  <Text>Close</Text>
</TouchableOpacity>
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
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ApplicationProvider } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';
import { ComponentName } from '../lib/components/ComponentName';

// Test wrapper with UI Kitten provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ApplicationProvider {...eva} theme={eva.light}>
    {children}
  </ApplicationProvider>
);

describe('ComponentName', () => {
  it('renders correctly with default props', () => {
    const { getByTestId } = render(<ComponentName testID="component" />, { wrapper: TestWrapper });

    expect(getByTestId('component')).toBeTruthy();
  });

  it('applies variant styles correctly', () => {
    const { getByTestId } = render(<ComponentName variant="secondary" testID="component" />, { wrapper: TestWrapper });

    const component = getByTestId('component');
    expect(component).toBeTruthy();
  });

  it('handles press events correctly', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ComponentName onPress={onPress} testID="component" />, { wrapper: TestWrapper });

    fireEvent.press(getByTestId('component'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ComponentName disabled onPress={onPress} testID="component" />, {
      wrapper: TestWrapper,
    });

    fireEvent.press(getByTestId('component'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

#### 2. Accessibility Tests

```tsx
describe('ComponentName Accessibility', () => {
  it('has proper accessibility attributes', () => {
    const { getByTestId } = render(
      <ComponentName
        testID="component"
        accessibilityLabel="Test component"
        accessibilityHint="This is a test component"
      />,
      { wrapper: TestWrapper },
    );

    const component = getByTestId('component');
    expect(component.props.accessibilityLabel).toBe('Test component');
    expect(component.props.accessibilityHint).toBe('This is a test component');
  });

  it('supports accessibility state changes', () => {
    const { getByTestId, rerender } = render(<ComponentName testID="component" disabled={false} />, {
      wrapper: TestWrapper,
    });

    let component = getByTestId('component');
    expect(component.props.accessibilityState?.disabled).toBeFalsy();

    rerender(
      <TestWrapper>
        <ComponentName testID="component" disabled={true} />
      </TestWrapper>,
    );

    component = getByTestId('component');
    expect(component.props.accessibilityState?.disabled).toBeTruthy();
  });
});
```

#### 3. Platform-Specific Tests

```tsx
import { Platform } from 'react-native';

describe('ComponentName Platform Tests', () => {
  it('applies iOS-specific styles', () => {
    Platform.OS = 'ios';
    const { getByTestId } = render(<ComponentName testID="component" />, { wrapper: TestWrapper });

    const component = getByTestId('component');
    // Test iOS-specific styling
    expect(component.props.style).toMatchObject({
      shadowColor: '#000',
    });
  });

  it('applies Android-specific styles', () => {
    Platform.OS = 'android';
    const { getByTestId } = render(<ComponentName testID="component" />, { wrapper: TestWrapper });

    const component = getByTestId('component');
    // Test Android-specific styling
    expect(component.props.style).toMatchObject({
      elevation: 5,
    });
  });
});
```

### Testing Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run comprehensive CI tests
pnpm test:ci

# Run specific component tests
pnpm jest __tests__/components/ComponentName.test.tsx
```

## 📚 Storybook Development

### Story Structure

Each component should have comprehensive Storybook stories:

```tsx
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import { ComponentName } from './ComponentName';
import { ApplicationProvider } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';

// Wrapper component for UI Kitten
const UIKittenWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApplicationProvider {...eva} theme={eva.light}>
    {children}
  </ApplicationProvider>
);

const meta: Meta<typeof ComponentName> = {
  title: 'Mobile/ComponentName',
  component: ComponentName,
  decorators: [
    Story => (
      <UIKittenWrapper>
        <Story />
      </UIKittenWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'A versatile component built on UI Kitten foundation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'danger', 'success', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const AllVariants: Story = {
  render: () => (
    <UIKittenWrapper>
      <div style={{ padding: 16, gap: 8 }}>
        <ComponentName variant="primary" />
        <ComponentName variant="secondary" />
        <ComponentName variant="outline" />
      </div>
    </UIKittenWrapper>
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

### Eva Design System Integration

Use Eva Design System variables for consistent theming:

```tsx
import { useTheme } from '@ui-kitten/components';

const Component = () => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme['background-basic-color-1'],
      borderColor: theme['border-basic-color-3'],
      padding: 16,
    },
    text: {
      color: theme['text-basic-color'],
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Themed component</Text>
    </View>
  );
};
```

### Custom Theme Creation

Create custom themes by extending Eva Design:

```json
// custom-theme.json
{
  "color-primary-100": "#F2F6FF",
  "color-primary-200": "#D9E4FF",
  "color-primary-300": "#A6C1FF",
  "color-primary-400": "#598BFF",
  "color-primary-500": "#3366FF",
  "color-primary-600": "#274BDB",
  "color-primary-700": "#1A34B8",
  "color-primary-800": "#102694",
  "color-primary-900": "#091C7A",

  "text-font-family": "System",
  "text-font-size": 14,
  "text-line-height": 20,

  "border-radius": 8,
  "border-width": 1
}
```

### Responsive Design Patterns

```tsx
import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: width > 768 ? 24 : 16, // Tablet vs mobile padding
  },
  grid: {
    flexDirection: width > 768 ? 'row' : 'column', // Responsive layout
  },
  text: {
    fontSize: width > 768 ? 18 : 16, // Responsive font size
  },
});
```

## 🔧 Build and Development

### Development Workflow

1. **Start Development**: `pnpm dev` (builds in watch mode)
2. **Run Storybook**: `pnpm storybook` (component development)
3. **Run Tests**: `pnpm test:watch` (test-driven development)
4. **Integration Test in App**: Launch the consumer Expo app in `apps/mobile` (e.g. `cd apps/mobile && pnpm start`). The library is symlinked via the workspace so edits reflect immediately.

### Running the Consumer App (Expo)

All runtime / UX validation now happens inside `apps/mobile`.

```bash
# From repo root or any path
cd apps/mobile
pnpm start              # Starts Expo (choose platform)
pnpm expo run:ios       # (Optional) build & run iOS
pnpm expo run:android   # (Optional) build & run Android
```

### Build Process

```bash
# Build the library
pnpm build

# Build Storybook
pnpm build-storybook

# (Former showcase build step removed)
```

### Code Quality

#### ESLint Configuration

```json
{
  "extends": ["@todo/config-eslint/react-native"]
}
```

#### TypeScript Configuration

```json
{
  "extends": "@todo/config-ts/react-native.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["lib/*"]
    }
  }
}
```

## 📱 Platform Considerations

### iOS Development

#### iOS-Specific Styling

```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
});
```

#### iOS Accessibility

```tsx
// iOS-specific accessibility features
<View
  accessibilityLabel="iOS specific label"
  accessibilityTraits={['button']} // iOS specific
  accessibilityRole="button" // Cross-platform
>
  <Text>Button</Text>
</View>
```

### Android Development

#### Android-Specific Styling

```tsx
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      android: {
        elevation: 5,
        borderRadius: 2,
      },
    }),
  },
});
```

#### Android Accessibility

```tsx
// Android-specific accessibility features
<View
  accessibilityLabel="Android specific label"
  accessibilityRole="button"
  accessible={true}
  importantForAccessibility="yes" // Android specific
>
  <Text>Button</Text>
</View>
```

### Cross-Platform Best Practices

1. **Consistent API**: Maintain the same component API across platforms
2. **Platform Detection**: Use Platform.select() for platform-specific code
3. **Responsive Design**: Consider different screen sizes and densities
4. **Performance**: Optimize for mobile device constraints

```tsx
import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// Platform-aware component logic
const Component = () => {
  const styles = StyleSheet.create({
    container: {
      padding: isTablet ? 24 : 16,
      ...Platform.select({
        ios: { shadowOpacity: 0.25 },
        android: { elevation: 5 },
      }),
    },
  });

  return <View style={styles.container}>{/* Content */}</View>;
};
```

## 🚀 Performance Guidelines

### React Native Performance

1. **FlatList for Large Lists**: Use FlatList instead of ScrollView for large datasets
2. **Image Optimization**: Optimize images for mobile devices
3. **Memory Management**: Avoid memory leaks with proper cleanup
4. **Native Modules**: Use native modules for performance-critical operations

```tsx
// Good: Using FlatList for performance
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>

// Good: Optimized images
<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
  loadingIndicatorSource={require('./loading.png')}
/>
```

### Component Performance

1. **React.memo**: Use for expensive components
2. **useCallback**: Optimize callback functions
3. **useMemo**: Memoize expensive calculations
4. **Avoid Inline Styles**: Use StyleSheet for better performance

```tsx
// Good: Memoized component
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = React.useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);

  const handlePress = React.useCallback(() => {
    // Handle press
  }, []);

  return (
    <View style={styles.container}>
      {processedData.map(item => (
        <TouchableOpacity key={item.id} onPress={handlePress}>
          <Text>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

// Good: StyleSheet for performance
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

## 📋 Checklist for New Components

Before submitting a new component, ensure:

### Implementation

- [ ] Component follows naming conventions (PascalCase)
- [ ] Uses UI Kitten component as foundation
- [ ] Implements proper TypeScript interfaces
- [ ] Uses StyleSheet for styling
- [ ] Supports platform-specific styling when needed
- [ ] Includes proper error handling

### Styling

- [ ] Uses Eva Design System variables
- [ ] Supports light and dark themes
- [ ] Includes responsive design considerations
- [ ] Follows platform design guidelines
- [ ] Optimizes for performance (StyleSheet vs inline styles)

### Accessibility

- [ ] Includes proper accessibility labels
- [ ] Supports screen readers (VoiceOver/TalkBack)
- [ ] Has appropriate touch target sizes (44x44 points minimum)
- [ ] Includes accessibility hints when helpful
- [ ] Works with accessibility services

### Testing

- [ ] Has comprehensive unit tests
- [ ] Includes accessibility tests
- [ ] Has platform-specific tests when needed
- [ ] Tests component interactions and state changes
- [ ] Achieves required coverage thresholds

### Documentation Checklist

- [ ] Has complete Storybook stories
- [ ] Includes usage examples for React Native
- [ ] Documents all props and variants
- [ ] Has proper JSDoc comments
- [ ] Updates main package exports

### Quality Assurance

- [ ] Passes ESLint checks
- [ ] Passes TypeScript compilation
- [ ] Works on both iOS and Android
- [ ] Performs well on mobile devices
- [ ] Has no console errors or warnings

## 🤝 Code Review Guidelines

### What to Look For

1. **Mobile UX**: Does the component provide good mobile user experience?
2. **Performance**: Are there any performance concerns for mobile devices?
3. **Platform Consistency**: Does it work well on both iOS and Android?
4. **Accessibility**: Does it meet mobile accessibility standards?
5. **Testing**: Is the test coverage comprehensive for mobile scenarios?

### Review Checklist

- [ ] Component follows React Native best practices
- [ ] UI Kitten integration is correct and efficient
- [ ] TypeScript types are comprehensive and accurate
- [ ] Styling follows Eva Design System guidelines
- [ ] Tests cover mobile-specific functionality
- [ ] Storybook stories work in React Native environment
- [ ] Performance is optimized for mobile devices
- [ ] Accessibility works with mobile screen readers
- [ ] Cross-platform compatibility is maintained

## 📚 Resources

### Documentation

- [UI Kitten Documentation](https://akveo.github.io/react-native-ui-kitten/)
- [Eva Design System](https://eva.design/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)

### Tools

- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

### Testing Checklist

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/docs/getting-started)

### Performance

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Flipper Performance Plugin](https://fbflipper.com/docs/features/react-native-plugin/)

This development guide ensures consistent, high-quality component development across the `@todo/ui-mobile` package with proper React Native and mobile development practices.
