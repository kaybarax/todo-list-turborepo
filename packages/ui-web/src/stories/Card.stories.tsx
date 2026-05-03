// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import React from 'react';

import { Button } from '../../lib/components/Button/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../lib/components/Card/Card';

const meta: Meta<typeof Card> = {
  title: 'Data Display/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    elevation: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'xl'] },
    interactive: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { elevation: 'xl', interactive: false },
  render: args => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Short description of the card content.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Body content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  args: { elevation: 'md', interactive: true },
  render: args => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover or focus to see elevation change.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Keyboard focusable when interactive.</p>
      </CardContent>
      <CardFooter>
        <Button>Primary</Button>
      </CardFooter>
    </Card>
  ),
};
