# DaisyUI + Style Dictionary Integration Guide

This guide documents the architecture and integration approach for combining DaisyUI with Style Dictionary in the todo-list-turborepo project.

## Architecture Overview

The integration combines three key technologies:

- **Style Dictionary**: Token generation and management system
- **DaisyUI**: Tailwind CSS component library with semantic theming
- **Tailwind CSS**: Utility-first CSS framework

### Integration Flow

```text
Design Tokens (JSON) → Style Dictionary → Generated Assets → DaisyUI + Tailwind → Components
```

1. **Token Definition**: Design tokens defined in `packages/ui-web/tokens/`
2. **Token Generation**: Style Dictionary processes tokens into multiple formats
3. **Theme Integration**: Generated tokens integrate with DaisyUI's theme system
4. **Component Usage**: Components use DaisyUI classes with token-backed values

## Project Structure

```text
packages/ui-web/
├── tokens/                    # Design token definitions
│   ├── core/                 # Core design tokens
│   ├── semantic/             # Semantic token mappings
│   └── platforms/            # Platform-specific tokens
├── scripts/
│   └── build-tokens.cjs      # Style Dictionary build script
├── dist/tokens/              # Generated token files
│   ├── css-variables.css     # CSS custom properties
│   ├── tokens.js             # JavaScript exports
│   ├── tokens.d.ts           # TypeScript definitions
│   ├── tailwind-tokens.js    # Tailwind config tokens
│   └── daisyui-themes.js     # DaisyUI theme definitions
└── src/components/           # DaisyUI-based components
```

## Setup Instructions

### 1. Install Dependencies

```bash
# In packages/ui-web
npm install style-dictionary --save-dev
npm install daisyui tailwindcss --save-dev
```

### 2. Configure Style Dictionary

Create `packages/ui-web/style-dictionary.config.cjs`:

```javascript
const StyleDictionary = require('style-dictionary').default;

// Register custom transforms
StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  filter: token => token.attributes?.category === 'size',
  transform: token => parseFloat(token.original.value) + 'px',
});

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    web: {
      transformGroup: 'web',
      buildPath: 'dist/tokens/',
      files: [
        {
          destination: 'css-variables.css',
          format: 'css/variables',
        },
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
  },
};
```

### 3. Configure Tailwind with DaisyUI

Update `tailwind.config.js`:

```javascript
const tokens = require('./packages/ui-web/dist/tokens/tailwind-tokens.js');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: tokens.colors || {},
      spacing: tokens.spacing || {},
      // ... other token categories
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      'light',
      'dark', // Standard themes
      // Custom themes from Style Dictionary
      ...require('./packages/ui-web/dist/tokens/daisyui-themes.js').themes,
    ],
  },
};
```

### 4. Set Up Build Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "tokens:build": "node scripts/build-tokens.cjs",
    "tokens:watch": "nodemon --watch tokens --exec \"node scripts/build-tokens.cjs\"",
    "prebuild": "npm run tokens:build",
    "dev": "concurrently \"npm run tokens:watch\" \"vite build --watch\""
  }
}
```

## Token Organization

### Core Tokens

Define foundational design values in `tokens/core/`:

```json
// tokens/core/colors.json
{
  "color": {
    "blue": {
      "50": { "value": "#eff6ff" },
      "500": { "value": "#3b82f6" },
      "900": { "value": "#1e3a8a" }
    }
  }
}
```

### Semantic Tokens

Map core tokens to semantic meanings in `tokens/semantic/`:

```json
// tokens/semantic/colors.json
{
  "color": {
    "primary": {
      "light": { "value": "{color.blue.500}" },
      "dark": { "value": "{color.blue.400}" }
    }
  }
}
```

### DaisyUI Theme Integration

Generate DaisyUI-compatible themes:

```json
// Generated daisyui-themes.js
{
  "themes": [
    {
      "todo-light": {
        "primary": "#3b82f6",
        "secondary": "#64748b",
        "accent": "#f59e0b"
        // ... other DaisyUI color variables
      }
    }
  ]
}
```

## Component Development

### Using DaisyUI Classes

Components should use DaisyUI semantic classes:

```tsx
// ✅ Good: Uses DaisyUI semantic classes
export function Button({ variant = 'primary', children }) {
  return <button className={`btn btn-${variant}`}>{children}</button>;
}

// ❌ Avoid: Hardcoded colors
export function Button({ children }) {
  return <button className="bg-blue-500 text-white px-4 py-2">{children}</button>;
}
```

### Theme-Aware Components

Use DaisyUI's semantic color system:

```tsx
export function Card({ children }) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-base-content">{children}</div>
    </div>
  );
}
```

### TypeScript Integration

Use generated type definitions:

```tsx
import type { DesignTokens } from '@todo/ui-web/tokens';

export interface ButtonProps {
  variant?: keyof DesignTokens['color'];
  size?: keyof DesignTokens['spacing'];
}
```

## Theme Switching

### React Context Implementation

```tsx
// ThemeProvider.tsx
import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark' | 'todo-light' | 'todo-dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
```

### Theme Switcher Component

```tsx
// ThemeSwitcher.tsx
import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <select className="select select-bordered" value={theme} onChange={e => setTheme(e.target.value as Theme)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="todo-light">Todo Light</option>
      <option value="todo-dark">Todo Dark</option>
    </select>
  );
}
```

## Build Integration

### Development Workflow

1. **Token Watching**: Tokens rebuild automatically during development
2. **Hot Reloading**: Component changes reflect immediately
3. **Type Safety**: TypeScript validates token usage

### Production Build

1. **Token Generation**: Style Dictionary runs before main build
2. **Asset Optimization**: Generated CSS is optimized by PostCSS
3. **Theme Validation**: Build fails if themes are invalid

## Troubleshooting

### Common Issues

#### Tokens Not Loading

- Ensure Style Dictionary build runs before Tailwind compilation
- Check file paths in configuration
- Verify token JSON syntax

#### Theme Not Applying

- Confirm `data-theme` attribute is set on `<html>` element
- Check DaisyUI theme configuration
- Verify CSS custom properties are loaded

#### Build Failures

- Run `npm run tokens:build` manually to check for errors
- Validate JSON token files
- Check Style Dictionary configuration

### Performance Optimization

#### Token Generation

- Use file watching in development
- Cache generated tokens in CI/CD
- Minimize token rebuilds

#### CSS Optimization

- Use PurgeCSS to remove unused styles
- Optimize DaisyUI theme selection
- Minimize custom CSS overrides

## Best Practices

### Token Management

- Use semantic tokens for component properties
- Keep core tokens platform-agnostic
- Document token usage and relationships

### Component Development

- Prefer DaisyUI classes over custom CSS
- Use semantic color names (primary, secondary, etc.)
- Implement proper TypeScript types

### Theme Design

- Ensure sufficient color contrast
- Test themes across all components
- Provide light and dark variants

### Build Configuration

- Always run token generation before builds
- Validate token integrity in CI/CD
- Use proper error handling for missing tokens

## Migration Guide

### From Hardcoded Styles

1. **Audit Current Styles**: Identify hardcoded colors, spacing, etc.
2. **Create Tokens**: Define equivalent design tokens
3. **Update Components**: Replace hardcoded values with DaisyUI classes
4. **Test Themes**: Verify components work across all themes

### From Other Design Systems

1. **Map Existing Tokens**: Convert current tokens to Style Dictionary format
2. **Update Build Process**: Integrate Style Dictionary into build pipeline
3. **Refactor Components**: Adopt DaisyUI component patterns
4. **Validate Integration**: Test theme switching and token usage

## Resources

- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [DaisyUI Documentation](https://daisyui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Storybook Guidelines](../../STORYBOOK_GUIDELINES.md) - Interactive component examples and workflow
