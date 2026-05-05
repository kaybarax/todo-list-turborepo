# Token Management and Customization Guide

This guide provides comprehensive instructions for managing and customizing design tokens in the DaisyUI + Style Dictionary integration.

## Token Structure Overview

### Token Hierarchy

```text
tokens/
├── core/                     # Foundation tokens
│   ├── colors.json          # Color palette
│   ├── spacing.json         # Spacing scale
│   ├── typography.json      # Font definitions
│   ├── borders.json         # Border radius, width
│   └── shadows.json         # Shadow definitions
├── semantic/                # Semantic mappings
│   ├── colors.json          # Semantic color roles
│   ├── components.json      # Component-specific tokens
│   └── themes.json          # Theme variations
└── platforms/               # Platform-specific tokens
    ├── web.json            # Web-specific tokens
    └── mobile.json         # Mobile-specific tokens
```

### Token Naming Convention

Follow the structured naming pattern:

```text
[category].[subcategory].[variant].[state]
```

Examples:

- `color.primary.500` - Core color token
- `color.semantic.primary.light` - Semantic color for light theme
- `spacing.component.button.padding` - Component-specific spacing
- `typography.heading.large.lineHeight` - Typography property

## Core Token Management

### Color Tokens

Define your color palette in `tokens/core/colors.json`:

```json
{
  "color": {
    "blue": {
      "50": { "value": "#eff6ff" },
      "100": { "value": "#dbeafe" },
      "200": { "value": "#bfdbfe" },
      "300": { "value": "#93c5fd" },
      "400": { "value": "#60a5fa" },
      "500": { "value": "#3b82f6" },
      "600": { "value": "#2563eb" },
      "700": { "value": "#1d4ed8" },
      "800": { "value": "#1e40af" },
      "900": { "value": "#1e3a8a" }
    },
    "gray": {
      "50": { "value": "#f9fafb" },
      "100": { "value": "#f3f4f6" },
      "500": { "value": "#6b7280" },
      "900": { "value": "#111827" }
    }
  }
}
```

### Spacing Tokens

Define consistent spacing in `tokens/core/spacing.json`:

```json
{
  "spacing": {
    "0": { "value": "0" },
    "1": { "value": "0.25rem" },
    "2": { "value": "0.5rem" },
    "3": { "value": "0.75rem" },
    "4": { "value": "1rem" },
    "6": { "value": "1.5rem" },
    "8": { "value": "2rem" },
    "12": { "value": "3rem" },
    "16": { "value": "4rem" },
    "20": { "value": "5rem" }
  }
}
```

### Typography Tokens

Define typography system in `tokens/core/typography.json`:

```json
{
  "typography": {
    "fontFamily": {
      "sans": { "value": ["Inter", "system-ui", "sans-serif"] },
      "serif": { "value": ["Georgia", "serif"] },
      "mono": { "value": ["Menlo", "Monaco", "monospace"] }
    },
    "fontSize": {
      "xs": { "value": "0.75rem" },
      "sm": { "value": "0.875rem" },
      "base": { "value": "1rem" },
      "lg": { "value": "1.125rem" },
      "xl": { "value": "1.25rem" },
      "2xl": { "value": "1.5rem" },
      "3xl": { "value": "1.875rem" }
    },
    "lineHeight": {
      "tight": { "value": "1.25" },
      "normal": { "value": "1.5" },
      "relaxed": { "value": "1.75" }
    }
  }
}
```

## Semantic Token Management

### Color Semantics

Map core colors to semantic roles in `tokens/semantic/colors.json`:

```json
{
  "color": {
    "semantic": {
      "primary": {
        "light": { "value": "{color.blue.500}" },
        "dark": { "value": "{color.blue.400}" }
      },
      "secondary": {
        "light": { "value": "{color.gray.500}" },
        "dark": { "value": "{color.gray.400}" }
      },
      "success": {
        "light": { "value": "{color.green.500}" },
        "dark": { "value": "{color.green.400}" }
      },
      "warning": {
        "light": { "value": "{color.yellow.500}" },
        "dark": { "value": "{color.yellow.400}" }
      },
      "error": {
        "light": { "value": "{color.red.500}" },
        "dark": { "value": "{color.red.400}" }
      }
    }
  }
}
```

### Component Tokens

Define component-specific tokens in `tokens/semantic/components.json`:

```json
{
  "component": {
    "button": {
      "padding": {
        "small": { "value": "{spacing.2} {spacing.3}" },
        "medium": { "value": "{spacing.3} {spacing.4}" },
        "large": { "value": "{spacing.4} {spacing.6}" }
      },
      "borderRadius": {
        "default": { "value": "{borderRadius.md}" }
      }
    },
    "card": {
      "padding": { "value": "{spacing.6}" },
      "borderRadius": { "value": "{borderRadius.lg}" },
      "shadow": { "value": "{shadow.lg}" }
    }
  }
}
```

## Theme Customization

### Creating Custom Themes

Define theme variations in `tokens/semantic/themes.json`:

```json
{
  "theme": {
    "todo": {
      "light": {
        "color": {
          "primary": { "value": "{color.blue.500}" },
          "secondary": { "value": "{color.gray.500}" },
          "accent": { "value": "{color.purple.500}" },
          "neutral": { "value": "{color.gray.700}" },
          "base-100": { "value": "{color.white}" },
          "base-200": { "value": "{color.gray.50}" },
          "base-300": { "value": "{color.gray.100}" },
          "base-content": { "value": "{color.gray.900}" }
        }
      },
      "dark": {
        "color": {
          "primary": { "value": "{color.blue.400}" },
          "secondary": { "value": "{color.gray.400}" },
          "accent": { "value": "{color.purple.400}" },
          "neutral": { "value": "{color.gray.300}" },
          "base-100": { "value": "{color.gray.900}" },
          "base-200": { "value": "{color.gray.800}" },
          "base-300": { "value": "{color.gray.700}" },
          "base-content": { "value": "{color.gray.100}" }
        }
      }
    }
  }
}
```

### DaisyUI Theme Integration

The build system automatically generates DaisyUI-compatible themes:

```javascript
// Generated daisyui-themes.js
module.exports = {
  themes: [
    {
      'todo-light': {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#8b5cf6',
        neutral: '#374151',
        'base-100': '#ffffff',
        'base-200': '#f9fafb',
        'base-300': '#f3f4f6',
        'base-content': '#111827',
        info: '#0ea5e9',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    },
    {
      'todo-dark': {
        primary: '#60a5fa',
        secondary: '#9ca3af',
        // ... dark theme values
      },
    },
  ],
};
```

## Token Validation and Quality

### Validation Rules

Implement validation in your build process:

```javascript
// scripts/validate-tokens.js
const tokens = require('../dist/tokens/tokens.json');

function validateColorContrast(foreground, background) {
  // Implement WCAG contrast ratio validation
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 4.5; // AA standard
}

function validateTokenStructure(tokens) {
  const requiredCategories = ['color', 'spacing', 'typography'];
  return requiredCategories.every(category => tokens.hasOwnProperty(category));
}
```

### Quality Checks

- **Contrast Ratios**: Ensure accessibility compliance
- **Consistency**: Verify naming conventions
- **Completeness**: Check all required tokens exist
- **References**: Validate token references resolve correctly

## Advanced Customization

### Custom Transforms

Add custom Style Dictionary transforms:

```javascript
// scripts/build-tokens.cjs
StyleDictionary.registerTransform({
  name: 'color/daisyui',
  type: 'value',
  filter: token => token.attributes?.category === 'color',
  transform: token => {
    // Convert to DaisyUI color format
    return convertToDaisyUIColor(token.value);
  },
});
```

### Custom Formats

Create custom output formats:

```javascript
StyleDictionary.registerFormat({
  name: 'daisyui/themes',
  format: function (dictionary) {
    const themes = generateDaisyUIThemes(dictionary.tokens);
    return `module.exports = ${JSON.stringify({ themes }, null, 2)};`;
  },
});
```

### Conditional Tokens

Use conditional logic for platform-specific tokens:

```json
{
  "color": {
    "primary": {
      "value": "{color.blue.500}",
      "attributes": {
        "category": "color",
        "type": "primary"
      },
      "web": {
        "value": "{color.blue.500}"
      },
      "mobile": {
        "value": "{color.blue.600}"
      }
    }
  }
}
```

## Token Documentation

### Automated Documentation

Generate token documentation:

```javascript
// scripts/generate-docs.js
StyleDictionary.registerFormat({
  name: 'documentation/markdown',
  format: function (dictionary) {
    return generateMarkdownDocs(dictionary.tokens);
  },
});
```

### Token Comments

Document token usage:

```json
{
  "color": {
    "primary": {
      "value": "#3b82f6",
      "comment": "Primary brand color used for buttons, links, and key UI elements",
      "attributes": {
        "category": "color",
        "type": "primary",
        "usage": ["buttons", "links", "focus-states"]
      }
    }
  }
}
```

## Migration Strategies

### From Existing Design System

1. **Token Audit**: Inventory current design tokens
2. **Mapping**: Create mapping between old and new tokens
3. **Gradual Migration**: Migrate components incrementally
4. **Validation**: Test visual consistency

### Version Management

Use semantic versioning for token changes:

- **Major**: Breaking changes (token removal, significant value changes)
- **Minor**: New tokens, non-breaking enhancements
- **Patch**: Bug fixes, minor adjustments

### Deprecation Strategy

```json
{
  "color": {
    "oldPrimary": {
      "value": "#3b82f6",
      "deprecated": true,
      "replacement": "color.primary.500",
      "comment": "Deprecated in v2.0.0, use color.primary.500 instead"
    }
  }
}
```

## Tooling and Automation

### VS Code Integration

Create `.vscode/settings.json` for token autocomplete:

```json
{
  "css.customData": [".vscode/css-custom-data.json"],
  "tailwindCSS.experimental.configFile": "tailwind.config.js"
}
```

### Build Automation

Set up automated token validation in CI/CD:

```yaml
# .github/workflows/tokens.yml
name: Token Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Tokens
        run: |
          npm run tokens:build
          npm run tokens:validate
```

### Development Tools

Create helper scripts:

```bash
#!/bin/bash
# scripts/token-helper.sh

case "$1" in
  "validate")
    npm run tokens:build && npm run tokens:validate
    ;;
  "preview")
    npm run tokens:build && npm run storybook
    ;;
  "diff")
    git diff HEAD~1 -- tokens/
    ;;
esac
```

## Best Practices

### Token Organization

- Group related tokens together
- Use consistent naming conventions
- Document token relationships
- Maintain semantic meaning

### Value Management

- Use relative units where appropriate
- Maintain mathematical relationships
- Consider accessibility requirements
- Test across different contexts

### Collaboration

- Involve designers in token definition
- Create shared token libraries
- Document decision rationale
- Establish review processes

### Performance

- Minimize token generation time
- Cache generated assets
- Optimize output formats
- Monitor bundle size impact

## Troubleshooting

### Common Issues

**Token References Not Resolving**

```bash
# Check token structure
npm run tokens:build -- --verbose

# Validate JSON syntax
jsonlint tokens/**/*.json
```

**Theme Not Applying**

```bash
# Verify theme generation
cat dist/tokens/daisyui-themes.js

# Check HTML data-theme attribute
document.documentElement.getAttribute('data-theme')
```

**Build Performance Issues**

```bash
# Profile token build time
time npm run tokens:build

# Optimize token structure
npm run tokens:analyze
```

### Debug Commands

```bash
# Build with verbose output
npm run tokens:build -- --verbose

# Validate token structure
npm run tokens:validate

# Generate token documentation
npm run tokens:docs

# Preview tokens in Storybook
npm run storybook
```

## Resources

- [Style Dictionary Transforms](https://amzn.github.io/style-dictionary/#/transforms)
- [DaisyUI Theme Generator](https://daisyui.com/theme-generator/)
- [Design Token Community Group](https://www.designtokens.org/)
- [Token Naming Conventions](https://spectrum.adobe.com/page/design-tokens/)
