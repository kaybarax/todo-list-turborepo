import { type Meta, type StoryObj } from '@storybook/react';

import { withUIKitten } from './decorators/UIKittenProvider';
import './shared/story-styles.css';
import { Avatar } from '../../lib/components/Avatar/Avatar';

// Mapping from legacy story sizes to real Avatar sizes
const legacyToRealSize: Record<string, string> = {
  xs: 'tiny',
  sm: 'small',
  md: 'medium',
  lg: 'large',
  xl: 'giant',
};

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar as React.ComponentType<any>,
  // @ts-ignore
  decorators: [withUIKitten],
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    docs: {
      description: {
        component:
          'React Native Avatar component using UI Kitten + enhanced theme. Supports image source, initials fallback, sizes, shapes, and custom colors.',
      },
    },
  },
  argTypes: {
    // @ts-ignore
    size: {
      control: { type: 'select' },
      options: ['tiny', 'small', 'medium', 'large', 'giant'],
      description: 'Avatar size',
    },
    shape: {
      control: { type: 'select' },
      options: ['round', 'rounded', 'square'],
      description: 'Avatar shape',
    },
    initials: { control: { type: 'text' }, description: 'Initials to display when no image is provided' },
    source: { control: { type: 'text' }, description: 'Image URL to display' },
    backgroundColor: { control: 'color', description: 'Custom background color (when showing initials)' },
    textColor: { control: 'color', description: 'Custom initials text color' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initials: 'JD',
    size: 'medium',
  },
};

export const WithInitials: Story = {
  args: {
    initials: 'AB',
    size: 'medium',
  },
};

export const WithImage: Story = {
  args: {
    source: 'https://via.placeholder.com/150/007AFF/FFFFFF?text=Avatar',
    size: 'medium',
  },
};

export const ExtraSmall: Story = {
  args: {
    initials: 'XS',
    size: legacyToRealSize['xs'],
  },
};

export const Small: Story = {
  args: {
    initials: 'SM',
    size: legacyToRealSize['sm'],
  },
};

export const Medium: Story = {
  args: {
    initials: 'MD',
    size: legacyToRealSize['md'],
  },
};

export const Large: Story = {
  args: {
    initials: 'LG',
    size: legacyToRealSize['lg'],
  },
};

export const ExtraLarge: Story = {
  args: {
    initials: 'XL',
    size: legacyToRealSize['xl'],
  },
};

export const CustomColors: Story = {
  args: {
    initials: 'CC',
    size: 'medium',
    backgroundColor: '#34C759',
  },
};

export const PrimaryColor: Story = {
  args: {
    initials: 'PR',
    size: 'medium',
    backgroundColor: '#3366FF',
  },
};

export const SecondaryColor: Story = {
  args: {
    initials: 'SC',
    size: 'medium',
    backgroundColor: '#5856D6',
  },
};

export const SuccessColor: Story = {
  args: {
    initials: 'SU',
    size: 'medium',
    backgroundColor: '#34C759',
  },
};

export const DangerColor: Story = {
  args: {
    initials: 'DN',
    size: 'medium',
    backgroundColor: '#FF3D71',
  },
};

export const WarningColor: Story = {
  args: {
    initials: 'WR',
    size: 'medium',
    backgroundColor: '#FFAA00',
  },
};

export const LightBackground: Story = {
  args: {
    initials: 'LB',
    size: 'medium',
    backgroundColor: '#F2F2F7',
    textColor: '#222B45',
  },
};

export const DarkBackground: Story = {
  args: {
    initials: 'DB',
    size: 'medium',
    backgroundColor: '#222B45',
    textColor: '#FFFFFF',
  },
};

export const ImageSmall: Story = {
  args: {
    source: '../assets/avatar-image.png',
    size: legacyToRealSize['sm'],
  },
};

export const ImageLarge: Story = {
  args: {
    source: '../assets/avatar-image.png',
    size: legacyToRealSize['lg'],
  },
};
