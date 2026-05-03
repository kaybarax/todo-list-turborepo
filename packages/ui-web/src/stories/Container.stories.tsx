// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';

import { Container } from '../../lib/components/Container/Container';
import { Card } from '../../lib/components/Card/Card';

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: { control: 'select', options: ['sm', 'md', 'lg', 'xl', 'full'] },
    pad: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { maxWidth: 'lg', pad: 'md' },
  render: args => (
    <Container {...args}>
      <div className="py-6">
        <Card title="Container" subtitle="Responsive wrapper">
          Content
        </Card>
      </div>
    </Container>
  ),
};

export const Widths: Story = {
  render: () => (
    <div className="space-y-6">
      <Container maxWidth="sm">
        <div className="bg-base-200 p-4">sm</div>
      </Container>
      <Container maxWidth="md">
        <div className="bg-base-200 p-4">md</div>
      </Container>
      <Container maxWidth="lg">
        <div className="bg-base-200 p-4">lg</div>
      </Container>
      <Container maxWidth="xl">
        <div className="bg-base-200 p-4">xl</div>
      </Container>
      <Container maxWidth="full">
        <div className="bg-base-200 p-4">full</div>
      </Container>
    </div>
  ),
};
