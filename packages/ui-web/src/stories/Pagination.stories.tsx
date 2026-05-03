// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import React from 'react';

import { Pagination } from '../../lib/components/Pagination/Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    currentPage: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 1 } },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { currentPage: 3, totalPages: 10 },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Pagination size="sm" currentPage={2} totalPages={5} />
      <Pagination size="md" currentPage={3} totalPages={10} />
      <Pagination size="lg" currentPage={4} totalPages={12} />
    </div>
  ),
};
