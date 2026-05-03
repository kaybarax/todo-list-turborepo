// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import React from 'react';

import { Button } from '../../lib/components/Button/Button';
import { Tooltip } from '../../lib/components/Tooltip/Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlay/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    placement: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    color: {
      control: 'select',
      options: ['neutral', 'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => (
    <Tooltip {...args} content="Hello tooltip!">
      <Button>Hover me</Button>
    </Tooltip>
  ),
  args: { placement: 'top', color: 'neutral' },
};
