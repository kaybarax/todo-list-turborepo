# Visual Regression Testing Guide

## Overview

This document outlines the visual regression testing setup for the UI Web package, including Storybook integration, Chromatic configuration, and screenshot comparison testing.

## Testing Strategy

### 1. Storybook Visual Testing

We use Storybook as the primary tool for visual regression testing, providing:

- Component isolation for consistent testing
- Multiple viewport testing for responsive design
- Dark mode and theme testing
- Interactive component state testing

### 2. Chromatic Integration

Chromatic provides automated visual regression testing with:

- Cross-browser screenshot comparison
- Baseline image management
- CI/CD integration
- Visual diff reporting

### 3. Screenshot Comparison Testing

Local screenshot testing using jest-image-snapshot for:

- Pixel-perfect component rendering verification
- Custom test scenarios
- Integration with existing test suite

## File Structure

```text
packages/ui-web/
├── .storybook/
│   ├── main.ts                 # Storybook configuration
│   └── preview.ts              # Global story settings
├── lib/components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.stories.tsx  # Visual test stories
│   ├── Card/
│   │   ├── Card.tsx
│   │   └── Card.stories.tsx
│   └── ...
├── __tests__/visual/
│   ├── screenshot-tests.test.tsx
│   ├── __image_snapshots__/    # Generated screenshots
│   └── VISUAL_TESTING.md
├── chromatic.config.json       # Chromatic configuration
└── package.json               # Scripts and dependencies
```

## Story Categories

### 1. Component Variants

- All visual variants of each component
- Size variations (small, medium, large)
- State variations (disabled, loading, error)

### 2. Interactive States

- Hover states
- Focus states
- Active states
- Loading states

### 3. Responsive Testing

- Mobile viewport (375px)
- Tablet viewport (768px)
- Desktop viewport (1024px)
- Wide desktop viewport (1440px)

### 4. Theme Testing

- Light theme
- Dark theme
- Custom theme variations

### 5. Integration Testing

- Component combinations
- Form layouts
- Card layouts
- Complex compositions

## Running Visual Tests

### Local Development

```bash
# Start Storybook for visual development
npm run storybook

# Build Storybook for testing
npm run build-storybook

# Run screenshot comparison tests
npm run test:visual

# Run all tests including visual
npm test
```

### Chromatic Testing

```bash
# Run Chromatic visual regression testing
npm run chromatic

# Run Chromatic in CI mode
npm run chromatic:ci

# Full visual test pipeline
npm run visual-test
```

### CI/CD Integration

```bash
# CI-friendly visual testing
npm run visual-test:ci
```

## Configuration

### Storybook Configuration

The Storybook configuration includes:

- Viewport addon for responsive testing
- Backgrounds addon for theme testing
- A11y addon for accessibility testing
- Chromatic addon for visual regression

### Chromatic Configuration

Key settings in `chromatic.config.json`:

- `threshold`: 0.2 (20% difference threshold)
- `diffThreshold`: 0.063 (6.3% pixel difference)
- `exitZeroOnChanges`: false (fail on visual changes)
- `autoAcceptChanges`: false (require manual approval)

### Screenshot Testing Configuration

Jest image snapshot settings:

- `threshold`: 0.2 (20% difference threshold)
- `comparisonMethod`: 'ssim' (structural similarity)
- `failureThreshold`: 0.01 (1% failure threshold)
- `failureThresholdType`: 'percent'

## Best Practices

### 1. Story Writing

- Create comprehensive stories covering all component states
- Use consistent naming conventions
- Include documentation for each story
- Group related stories logically

### 2. Visual Testing

- Test all component variants and states
- Include responsive breakpoints
- Test dark mode and theme variations
- Test component interactions and integrations

### 3. Screenshot Management

- Keep screenshots up to date with component changes
- Review visual diffs carefully before approving
- Use descriptive names for screenshot identifiers
- Organize screenshots by component and test type

### 4. CI/CD Integration

- Run visual tests on every pull request
- Require visual approval for changes
- Use environment variables for Chromatic tokens
- Set up proper failure handling

## Troubleshooting

### Common Issues

1. **Inconsistent Screenshots**
   - Ensure consistent timing with delays
   - Disable animations for testing
   - Use fixed dimensions and fonts

2. **False Positives**
   - Adjust threshold settings
   - Check for anti-aliasing differences
   - Verify consistent rendering environment

3. **Missing Baselines**
   - Run initial Chromatic build to establish baselines
   - Ensure proper branch configuration
   - Check Chromatic project settings

### Debug Commands

```bash
# Debug Storybook build
npm run build-storybook -- --debug

# Debug Chromatic upload
npm run chromatic -- --debug

# Verbose screenshot testing
npm run test:visual -- --verbose
```

## Environment Variables

Required environment variables:

- `CHROMATIC_PROJECT_TOKEN`: Chromatic project token for web package
- `CI`: Set to true in CI environments

## Maintenance

### Regular Tasks

- Update screenshot baselines when components change
- Review and approve visual changes in Chromatic
- Update test configurations as needed
- Monitor test performance and reliability

### Version Updates

- Keep Storybook and Chromatic dependencies updated
- Test visual regression after major updates
- Update configuration files as needed
- Review and update documentation

## Integration with Development Workflow

### Pull Request Process

1. Developer creates PR with component changes
2. Visual tests run automatically in CI
3. Chromatic generates visual diffs
4. Reviewer approves or requests changes
5. Visual baselines updated on merge

### Release Process

1. All visual tests must pass
2. Visual changes documented in changelog
3. New baselines established for release branch
4. Visual regression monitoring continues post-release
