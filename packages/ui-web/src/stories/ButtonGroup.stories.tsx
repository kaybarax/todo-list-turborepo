import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonGroup, Button } from '../index';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Button value="one">One</Button>
        <Button value="two">Two</Button>
        <Button value="three">Three</Button>
      </>
    ),
    defaultValue: 'one',
  },
};
