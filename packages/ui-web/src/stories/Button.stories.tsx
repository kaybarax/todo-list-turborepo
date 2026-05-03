// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import { Search, ArrowRight } from 'lucide-react';

import { Button } from '../../lib/components/Button/Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    asChild: {
      control: 'boolean',
      description: 'Whether to render as a child element instead of a button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
    },
    loadingText: {
      control: 'text',
      description: 'Text to display when the button is loading',
    },
    leftIcon: {
      control: { disable: true },
      description: 'Icon to display on the left side of the button text',
    },
    rightIcon: {
      control: { disable: true },
      description: 'Icon to display on the right side of the button text',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when the button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Default Button',
    variant: 'default',
    size: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive Button',
    variant: 'destructive',
    size: 'default',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
    size: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'default',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
    size: 'default',
  },
};

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
    size: 'default',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    variant: 'default',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    variant: 'default',
    size: 'lg',
  },
};

export const Icon: Story = {
  args: {
    children: '🔍',
    variant: 'default',
    size: 'icon',
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: 'Search',
    variant: 'default',
    size: 'default',
    leftIcon: <Search size={16} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Next',
    variant: 'default',
    size: 'default',
    rightIcon: <ArrowRight size={16} />,
  },
};

export const Loading: Story = {
  args: {
    children: 'Submit',
    variant: 'default',
    size: 'default',
    loading: true,
  },
};

export const LoadingWithText: Story = {
  args: {
    children: 'Submit',
    variant: 'default',
    size: 'default',
    loading: true,
    loadingText: 'Submitting...',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'default',
    size: 'default',
    disabled: true,
  },
};

export const AsChild: Story = {
  args: {
    children: 'As Child',
    variant: 'default',
    size: 'default',
    asChild: true,
  },
};

export const WithCustomClass: Story = {
  args: {
    children: 'Custom Class',
    variant: 'default',
    size: 'default',
    className: 'border-dashed',
  },
};
