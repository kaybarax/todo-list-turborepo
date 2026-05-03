// @ts-nocheck
/**
 * Common TypeScript types and interfaces for Storybook stories in ui-mobile package
 */

import { type Meta, type StoryObj } from '@storybook/react';
import { type ComponentType, type ReactNode, type CSSProperties } from 'react';

/**
 * Base story configuration interface for mobile components
 */
export interface MobileStoryConfig<T = object> {
  title: string;
  component: ComponentType<T>;
  parameters?: {
    layout?: 'centered' | 'fullscreen' | 'padded';
    docs?: {
      description?: {
        component?: string;
        story?: string;
      };
    };
    viewport?: {
      defaultViewport?: string;
      viewports?: Record<string, { name: string; styles: { width: string; height: string } }>;
    };
  };
  tags?: string[];
  argTypes?: Record<string, MobileArgTypeConfig>;
  args?: Partial<T>;
}

/**
 * ArgType configuration for mobile component controls
 */
export interface MobileArgTypeConfig {
  control?:
    | { type: 'text' }
    | { type: 'boolean' }
    | { type: 'number'; min?: number; max?: number; step?: number }
    | { type: 'range'; min?: number; max?: number; step?: number }
    | { type: 'color' }
    | { type: 'select'; options: string[] | number[] }
    | { type: 'multi-select'; options: string[] | number[] }
    | { type: 'radio'; options: string[] | number[] }
    | { type: 'object' }
    | false;
  description?: string;
  table?: {
    type?: { summary: string };
    defaultValue?: { summary: string };
    category?: string;
  };
  action?: string;
  if?: { arg: string; truthy?: boolean; exists?: boolean };
}

/**
 * Common mobile component prop patterns
 */
export interface MobileCommonProps {
  children?: ReactNode;
  style?: CSSProperties;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessible?: boolean;
}

/**
 * Mobile-specific variant types
 */
export type MobileVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'ghost';

/**
 * Mobile-specific size types (optimized for touch targets)
 */
export type MobileSize = 'small' | 'medium' | 'large';

/**
 * Mobile component state props
 */
export interface MobileStateProps {
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  success?: boolean;
  active?: boolean;
}

/**
 * Mobile button-like component props
 */
export interface MobileButtonProps extends MobileCommonProps, MobileStateProps {
  title?: string;
  variant?: MobileVariant;
  size?: MobileSize;
  onPress?: () => void;
  onLongPress?: () => void;
  leftIcon?: string;
  rightIcon?: string;
  iconColor?: string;
  fullWidth?: boolean;
  rounded?: boolean;
  hapticFeedback?: boolean;
}

/**
 * Mobile input-like component props
 */
export interface MobileInputProps extends MobileCommonProps, MobileStateProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
}

/**
 * Mobile form field props
 */
export interface MobileFormFieldProps extends MobileCommonProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  required?: boolean;
  optional?: boolean;
}

/**
 * Mobile layout component props
 */
export interface MobileLayoutProps extends MobileCommonProps {
  spacing?: number;
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
}

/**
 * Mobile card-like component props
 */
export interface MobileCardProps extends MobileCommonProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: number;
  margin?: number;
  borderRadius?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number; // Android elevation
}

/**
 * Mobile list item props
 */
export interface MobileListItemProps extends MobileCommonProps {
  title?: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  divider?: boolean;
}

/**
 * Mobile theme colors (matching React Native theme)
 */
export const mobileThemeColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  light: '#F2F2F7',
  medium: '#8E8E93',
  dark: '#1C1C1E',
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Mobile spacing scale
 */
export const mobileSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Mobile font sizes
 */
export const mobileFontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Mobile border radius scale
 */
export const mobileBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

/**
 * Utility type for creating mobile story meta with proper typing
 */
export type MobileStoryMeta<T> = Meta<T> & MobileStoryConfig<T>;

/**
 * Utility type for creating mobile story objects with proper typing
 */
export type MobileComponentStory<T> = StoryObj<MobileStoryMeta<T>>;

/**
 * Common argTypes configurations for mobile components
 */
export const mobileCommonArgTypes = {
  // Text controls
  title: {
    control: { type: 'text' },
    description: 'Text content to display',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'undefined' },
    },
  },

  children: {
    control: { type: 'text' },
    description: 'Content to display inside the component',
    table: {
      type: { summary: 'ReactNode' },
      defaultValue: { summary: 'undefined' },
    },
  },

  // Boolean controls
  disabled: {
    control: { type: 'boolean' },
    description: 'Whether the component is disabled',
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: 'false' },
    },
  },

  loading: {
    control: { type: 'boolean' },
    description: 'Whether the component is in loading state',
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: 'false' },
    },
  },

  fullWidth: {
    control: { type: 'boolean' },
    description: 'Whether the component should take full width',
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: 'false' },
    },
  },

  rounded: {
    control: { type: 'boolean' },
    description: 'Whether the component should have rounded corners',
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: 'false' },
    },
  },

  // Select controls
  variant: {
    control: { type: 'select' },
    options: ['primary', 'secondary', 'outline', 'danger', 'success', 'warning', 'ghost'],
    description: 'Visual variant of the component',
    table: {
      type: { summary: 'MobileVariant' },
      defaultValue: { summary: 'primary' },
    },
  },

  size: {
    control: { type: 'select' },
    options: ['small', 'medium', 'large'],
    description: 'Size of the component (optimized for mobile touch targets)',
    table: {
      type: { summary: 'MobileSize' },
      defaultValue: { summary: 'medium' },
    },
  },

  // Icon controls
  leftIcon: {
    control: { type: 'select' },
    options: [
      '',
      'add',
      'remove',
      'edit',
      'delete',
      'save',
      'search',
      'settings',
      'home',
      'user',
      'heart',
      'star',
      'check',
      'close',
      'arrow-forward',
      'arrow-back',
      'download',
      'upload',
    ],
    description: 'Icon to display on the left side',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'undefined' },
    },
  },

  rightIcon: {
    control: { type: 'select' },
    options: [
      '',
      'add',
      'remove',
      'edit',
      'delete',
      'save',
      'search',
      'settings',
      'home',
      'user',
      'heart',
      'star',
      'check',
      'close',
      'arrow-forward',
      'arrow-back',
      'download',
      'upload',
    ],
    description: 'Icon to display on the right side',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'undefined' },
    },
  },

  // Event handlers
  onPress: {
    action: 'pressed',
    description: 'Function called when component is pressed',
    table: {
      type: { summary: '() => void' },
      defaultValue: { summary: 'undefined' },
    },
  },

  onLongPress: {
    action: 'long-pressed',
    description: 'Function called when component is long pressed',
    table: {
      type: { summary: '() => void' },
      defaultValue: { summary: 'undefined' },
    },
  },

  onChangeText: {
    action: 'text-changed',
    description: 'Function called when text input changes',
    table: {
      type: { summary: '(text: string) => void' },
      defaultValue: { summary: 'undefined' },
    },
  },

  // Accessibility
  accessibilityLabel: {
    control: { type: 'text' },
    description: 'Accessibility label for screen readers',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'undefined' },
    },
  },

  accessibilityHint: {
    control: { type: 'text' },
    description: 'Accessibility hint describing what happens when activated',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'undefined' },
    },
  },

  testID: {
    control: { type: 'text' },
    description: 'Test identifier for automated testing',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'undefined' },
    },
  },
} as const satisfies Record<string, MobileArgTypeConfig>;

/**
 * Common story parameters for mobile components
 */
export const mobileCommonParameters = {
  centered: {
    layout: 'centered' as const,
  },

  padded: {
    layout: 'padded' as const,
  },

  mobileViewport: {
    viewport: {
      defaultViewport: 'mobile1',
      viewports: {
        mobile1: { name: 'iPhone SE', styles: { width: '375px', height: '667px' } },
        mobile2: { name: 'iPhone 12', styles: { width: '390px', height: '844px' } },
        mobile3: { name: 'iPhone 12 Pro Max', styles: { width: '428px', height: '926px' } },
        tablet: { name: 'iPad', styles: { width: '768px', height: '1024px' } },
        tabletLandscape: { name: 'iPad Landscape', styles: { width: '1024px', height: '768px' } },
      },
    },
  },
} as const;

/**
 * Icon mapping for web preview (commonly used mobile icons)
 */
export const mobileIconMap: Record<string, string> = {
  add: '+',
  remove: '−',
  edit: '✎',
  delete: '🗑',
  save: '💾',
  search: '🔍',
  settings: '⚙',
  home: '🏠',
  user: '👤',
  heart: '♥',
  star: '★',
  check: '✓',
  close: '✕',
  'arrow-forward': '→',
  'arrow-back': '←',
  'arrow-up': '↑',
  'arrow-down': '↓',
  download: '⬇',
  upload: '⬆',
  menu: '☰',
  more: '⋯',
  info: 'ℹ',
  warning: '⚠',
  error: '⚠',
  success: '✓',
  camera: '📷',
  gallery: '🖼',
  location: '📍',
  phone: '📞',
  email: '✉',
  calendar: '📅',
  clock: '🕐',
  lock: '🔒',
  unlock: '🔓',
  visibility: '👁',
  'visibility-off': '🙈',
  share: '📤',
  bookmark: '🔖',
  favorite: '❤️',
  refresh: '🔄',
  sync: '🔄',
  wifi: '📶',
  bluetooth: '🔵',
  battery: '🔋',
  volume: '🔊',
  notification: '🔔',
  message: '💬',
  chat: '💬',
  call: '📞',
  video: '📹',
  play: '▶️',
  pause: '⏸️',
  stop: '⏹️',
  'skip-next': '⏭️',
  'skip-previous': '⏮️',
  'fast-forward': '⏩',
  rewind: '⏪',
} as const;

/**
 * Helper function to create consistent mobile story meta
 */
export function createMobileStoryMeta<T>(config: {
  title: string;
  component: ComponentType<T>;
  description?: string;
  layout?: 'centered' | 'fullscreen' | 'padded';
  argTypes?: Record<string, MobileArgTypeConfig>;
  args?: Partial<T>;
}): MobileStoryMeta<T> {
  return {
    title: config.title,
    component: config.component,
    parameters: {
      layout: config.layout ?? 'centered',
      docs: {
        description: {
          component: config.description,
        },
      },
      ...mobileCommonParameters.mobileViewport,
    },
    tags: ['autodocs'],
    argTypes: config.argTypes ?? {},
    args: config.args ?? {},
  };
}

/**
 * Helper function to create mobile accessibility-focused stories
 */
export function createMobileA11yStory<T>(
  args: Partial<T> & {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
  },
  description?: string,
): MobileComponentStory<T> {
  return {
    args,
    parameters: {
      docs: {
        description: {
          story:
            description ?? 'Demonstrates proper mobile accessibility attributes for screen readers and voice control.',
        },
      },
    },
  };
}

/**
 * Helper function to create mobile interactive stories
 */
export function createMobileInteractiveStory<T>(
  renderFunction: () => ReactNode,
  description?: string,
): MobileComponentStory<T> {
  return {
    render: renderFunction,
    parameters: {
      docs: {
        description: {
          story: description ?? 'Interactive example demonstrating mobile component behavior and touch interactions.',
        },
      },
      ...mobileCommonParameters.mobileViewport,
    },
  };
}

/**
 * Helper function to create mobile layout stories
 */
export function createMobileLayoutStory<T>(
  renderFunction: () => ReactNode,
  description?: string,
): MobileComponentStory<T> {
  return {
    render: renderFunction,
    parameters: {
      docs: {
        description: {
          story: description ?? 'Demonstrates component layout in mobile-sized containers.',
        },
      },
      ...mobileCommonParameters.mobileViewport,
    },
  };
}

/**
 * Helper function to render mobile icons in web preview
 */
export function renderMobileIcon(iconName: string, size: number = 16): ReactNode {
  return (
    <span
      style={{
        fontSize: size,
        lineHeight: 1,
        display: 'inline-block',
      }}
    >
      {mobileIconMap[iconName] ?? iconName}
    </span>
  );
}

/**
 * Helper function to create mobile-appropriate styles for web preview
 */
export function createMobileWebStyles(config: {
  variant?: MobileVariant;
  size?: MobileSize;
  disabled?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
}): CSSProperties {
  const { variant = 'primary', size = 'medium', disabled = false, fullWidth = false, rounded = false } = config;

  // Variant styles
  const variantStyles: Record<MobileVariant, CSSProperties> = {
    primary: {
      backgroundColor: mobileThemeColors.primary,
      color: mobileThemeColors.white,
      borderColor: mobileThemeColors.primary,
    },
    secondary: {
      backgroundColor: mobileThemeColors.secondary,
      color: mobileThemeColors.white,
      borderColor: mobileThemeColors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      color: mobileThemeColors.primary,
      borderColor: mobileThemeColors.primary,
    },
    danger: {
      backgroundColor: mobileThemeColors.danger,
      color: mobileThemeColors.white,
      borderColor: mobileThemeColors.danger,
    },
    success: {
      backgroundColor: mobileThemeColors.success,
      color: mobileThemeColors.white,
      borderColor: mobileThemeColors.success,
    },
    warning: {
      backgroundColor: mobileThemeColors.warning,
      color: mobileThemeColors.white,
      borderColor: mobileThemeColors.warning,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: mobileThemeColors.primary,
      borderColor: 'transparent',
    },
  };

  // Size styles
  const sizeStyles: Record<MobileSize, CSSProperties> = {
    small: {
      padding: `${mobileSpacing.xs}px ${mobileSpacing.md}px`,
      fontSize: mobileFontSizes.sm,
      minHeight: 32,
      minWidth: 80,
    },
    medium: {
      padding: `${mobileSpacing.sm}px ${mobileSpacing.lg}px`,
      fontSize: mobileFontSizes.md,
      minHeight: 44, // iOS minimum touch target
      minWidth: 120,
    },
    large: {
      padding: `${mobileSpacing.md}px ${mobileSpacing.xl}px`,
      fontSize: mobileFontSizes.lg,
      minHeight: 56,
      minWidth: 160,
    },
  };

  return {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    border: '1px solid',
    borderRadius: rounded ? mobileBorderRadius.round : mobileBorderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    width: fullWidth ? '100%' : 'auto',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(disabled && {
      backgroundColor: mobileThemeColors.medium,
      color: mobileThemeColors.light,
      borderColor: mobileThemeColors.medium,
    }),
  };
}
