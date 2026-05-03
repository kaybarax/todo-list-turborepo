// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import React from 'react';

import { Button } from '../../lib/components/Button/Button';
import { Popover } from '../../lib/components/Popover/Popover';

const meta: Meta<typeof Popover> = {
  title: 'Overlay/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => (
    <Popover
      {...args}
      content={
        <div>
          <h4 className="font-semibold">Popover Title</h4>
          <p className="text-sm opacity-80">Some helpful content.</p>
        </div>
      }
    >
      <Button>Toggle Popover</Button>
    </Popover>
  ),
  args: { defaultOpen: true },
};
