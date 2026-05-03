// @ts-nocheck
import { type ArgType, type Decorator, type Parameters } from '@storybook/react';

import { withUIKitten } from '../decorators/UIKittenProvider';

// Shared docs/parameters baseline.
export const baseParameters: Parameters = {
  layout: 'centered',
  controls: { expanded: true },
  docs: {
    description: {
      component: 'Component documentation pending detailed description.',
    },
  },
};

// Standard decorators to apply across ui-mobile stories.
export const mobileDecorators: Decorator[] = [withUIKitten];

// Helper to assemble meta base parts; spread into individual meta objects.
export const buildMobileMeta = <T extends object>(overrides: {
  title: string;
  component: T;
  parameters?: Parameters;
  argTypes?: Record<string, ArgType>;
  decorators?: Decorator[];
  tags?: string[];
}) => {
  const { title, component, parameters, argTypes, decorators, tags } = overrides;
  return {
    title,
    component,
    parameters: { ...baseParameters, ...(parameters ?? {}) },
    argTypes: { ...(argTypes ?? {}) },
    decorators: decorators ?? mobileDecorators,
    tags: tags ?? ['autodocs'],
  } as const;
};
