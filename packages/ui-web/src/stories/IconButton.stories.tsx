// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import { Edit, Trash2, Settings, Plus, Heart, Star } from 'lucide-react';

import { IconButton } from '../../lib/components/IconButton/IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'default', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Edit className="h-4 w-4" />,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <IconButton variant="default">
        <Edit className="h-4 w-4" />
      </IconButton>
      <IconButton variant="destructive">
        <Trash2 className="h-4 w-4" />
      </IconButton>
      <IconButton variant="outline">
        <Settings className="h-4 w-4" />
      </IconButton>
      <IconButton variant="secondary">
        <Plus className="h-4 w-4" />
      </IconButton>
      <IconButton variant="ghost">
        <Heart className="h-4 w-4" />
      </IconButton>
      <IconButton variant="link">
        <Star className="h-4 w-4" />
      </IconButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <IconButton size="xs">
        <Edit className="h-3 w-3" />
      </IconButton>
      <IconButton size="sm">
        <Edit className="h-4 w-4" />
      </IconButton>
      <IconButton size="default">
        <Edit className="h-4 w-4" />
      </IconButton>
      <IconButton size="lg">
        <Edit className="h-5 w-5" />
      </IconButton>
    </div>
  ),
};

export const WithTooltip: Story = {
  render: () => (
    <IconButton title="Edit item" variant="ghost">
      <Edit className="h-4 w-4" />
    </IconButton>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: <Edit className="h-4 w-4" />,
  },
};
