// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import React from 'react';

import { Image } from '../../lib/components/Image/Image';

const meta: Meta<typeof Image> = {
  title: 'Media/Image',
  component: Image,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    fit: { control: 'select', options: ['cover', 'contain', 'fill', 'none', 'scaleDown'] },
    rounded: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'full'] },
    showLoading: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://picsum.photos/seed/image/400/240',
    alt: 'Random image',
    fit: 'cover',
    rounded: 'md',
    showLoading: true,
    style: { width: 300, height: 180 },
  },
};

export const WithFallback: Story = {
  render: () => (
    <Image
      alt="Broken image"
      fallback={<span className="text-base-content/60 text-sm">Image unavailable</span>}
      style={{ width: 200, height: 120 }}
    />
  ),
};
