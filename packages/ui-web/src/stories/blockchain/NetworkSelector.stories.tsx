import type { Meta, StoryObj } from '@storybook/react';
import { NetworkSelector } from '../../../lib/components/blockchain/NetworkSelector';

const meta: Meta<typeof NetworkSelector> = {
  title: 'Blockchain/NetworkSelector',
  component: NetworkSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NetworkSelector>;

export const Default: Story = {
  args: {
    networks: ['solana', 'polkadot', 'polygon', 'moonbeam', 'base'],
    selectedNetwork: 'solana',
    onSelect: network => console.info('Selected network:', network),
  },
};

export const WithCustomLabel: Story = {
  args: {
    networks: ['ethereum', 'binance-smart-chain', 'avalanche', 'fantom'],
    selectedNetwork: 'ethereum',
    onSelect: network => console.info('Selected network:', network),
    'aria-label': 'Choose blockchain network',
    id: 'custom-network-selector',
  },
};
