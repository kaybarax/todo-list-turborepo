// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import React, { type JSX } from 'react';

import { withUIKitten } from './decorators/UIKittenProvider';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'success' | 'warning' | 'error';
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

interface WebTextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  align?: TextAlign;
  weight?: FontWeight;
}

const colorMap: Record<TextColor, string> = {
  primary: '#111827',
  secondary: '#6B7280',
  tertiary: '#9CA3AF',
  inverse: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const weightMap: Record<FontWeight, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const WebText: React.FC<WebTextProps> = ({
  children,
  variant = 'body1',
  color = 'primary',
  align = 'left',
  weight,
}) => {
  const style: React.CSSProperties = {
    color: colorMap[color],
    textAlign: align,
    fontWeight: weight ? weightMap[weight] : undefined,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: variant === 'overline' ? 1 : undefined,
    textTransform: variant === 'overline' ? 'uppercase' : undefined,
    fontSize:
      variant === 'h1'
        ? 32
        : variant === 'h2'
          ? 28
          : variant === 'h3'
            ? 24
            : variant === 'h4'
              ? 20
              : variant === 'h5'
                ? 18
                : variant === 'h6'
                  ? 16
                  : variant === 'body2' || variant === 'caption' || variant === 'overline'
                    ? 12
                    : 14,
    margin: 0,
  };
  const Tag: keyof JSX.IntrinsicElements = variant.startsWith('h') ? variant : 'p';
  return <Tag style={style}>{children}</Tag>;
};

const meta: Meta<typeof WebText> = {
  title: 'Components/Text',
  component: WebText,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable text component with typography variants, colors, and accessibility features.',
      },
    },
  },
  decorators: [withUIKitten],
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption', 'overline'],
      description: 'Typography variant',
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'inverse', 'success', 'warning', 'error'],
      description: 'Text color variant',
    },
    align: {
      control: { type: 'select' },
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment',
    },
    weight: {
      control: { type: 'select' },
      options: ['light', 'normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Headings: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <WebText variant="h1">Heading 1 - Main page title</WebText>
      <WebText variant="h2">Heading 2 - Section title</WebText>
      <WebText variant="h3">Heading 3 - Subsection title</WebText>
      <WebText variant="h4">Heading 4 - Component title</WebText>
      <WebText variant="h5">Heading 5 - Small section</WebText>
      <WebText variant="h6">Heading 6 - Smallest heading</WebText>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const BodyText: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <WebText variant="body1">
        Body 1 - This is the primary body text used for most content. It provides good readability and is suitable for
        paragraphs and longer text blocks.
      </WebText>
      <WebText variant="body2">
        Body 2 - This is secondary body text, slightly smaller than body1. It's useful for supporting information and
        secondary content.
      </WebText>
      <WebText variant="caption">
        Caption - Small text used for captions, labels, and supplementary information.
      </WebText>
      <WebText variant="overline">OVERLINE - UPPERCASE TEXT FOR CATEGORIES AND LABELS</WebText>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <WebText color="primary">Primary text color</WebText>
      <WebText color="secondary">Secondary text color</WebText>
      <WebText color="tertiary">Tertiary text color</WebText>
      <WebText color="success">Success text color</WebText>
      <WebText color="warning">Warning text color</WebText>
      <WebText color="error">Error text color</WebText>
      <div style={{ backgroundColor: '#333', padding: '12px', borderRadius: '4px' }}>
        <WebText color="inverse">Inverse text color on dark background</WebText>
      </div>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Weights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <WebText weight="light">Light weight text</WebText>
      <WebText weight="normal">Normal weight text</WebText>
      <WebText weight="medium">Medium weight text</WebText>
      <WebText weight="semibold">Semibold weight text</WebText>
      <WebText weight="bold">Bold weight text</WebText>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Alignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <WebText align="left">Left aligned text - This text is aligned to the left side of the container.</WebText>
      <WebText align="center">Center aligned text - This text is centered in the container.</WebText>
      <WebText align="right">Right aligned text - This text is aligned to the right side of the container.</WebText>
      <WebText align="justify">
        Justified text - This text is justified to fill the entire width of the container, creating even margins on both
        sides.
      </WebText>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Interactive: Story = {
  args: {
    children: 'Customizable Text Component',
    variant: 'h3',
    color: 'primary',
    weight: 'medium',
    align: 'center',
  },
};
