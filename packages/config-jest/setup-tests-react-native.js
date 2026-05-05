import 'react-native-gesture-handler/jestSetup';

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
    expoVersion: '1.0.0',
  },
}));

jest.mock(
  'expo-linking',
  () => ({
    default: {
      createURL: jest.fn(),
      openURL: jest.fn(),
    },
    createURL: jest.fn(),
    openURL: jest.fn(),
  }),
  { virtual: true },
);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler components that rely on native/reanimated
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Swipeable = ({ children }) => React.createElement(View, null, children);
  const GestureHandlerRootView = ({ children, style }) => React.createElement(View, { style }, children);
  return {
    Swipeable,
    GestureHandlerRootView,
    State: {},
    PanGestureHandler: ({ children }) => React.createElement(View, null, children),
    TapGestureHandler: ({ children }) => React.createElement(View, null, children),
    LongPressGestureHandler: ({ children }) => React.createElement(View, null, children),
    BaseButton: ({ children, onPress }) => React.createElement(View, { onPress }, children),
    RectButton: ({ children, onPress }) => React.createElement(View, { onPress }, children),
  };
});

// Mock WalletConnect
jest.mock(
  '@walletconnect/react-native-compat',
  () => ({
    // Mock implementation
  }),
  { virtual: true },
);

// Silence the warning: Animated: `useNativeDriver` is not supported
// Note: React Native 0.76+ has different internal structure

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock @todo/ui-mobile to lightweight components to avoid theme/provider internals in tests
jest.mock('@todo/ui-mobile', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Button = ({ children, onPress, ...rest }) => {
    const disabled = !!rest.disabled;
    const pressHandler = disabled ? undefined : onPress;
    return React.createElement(
      View,
      { onPress: pressHandler, accessibilityRole: 'button', accessibilityState: { disabled }, ...rest },
      React.createElement(Text, { onPress: pressHandler }, children),
    );
  };
  const Card = ({ children, ...rest }) => React.createElement(View, { ...rest }, children);
  const CardContent = ({ children, ...rest }) => React.createElement(View, { ...rest }, children);
  const ButtonGroup = ({ children, ...rest }) => React.createElement(View, { ...rest }, children);
  const lightTheme = {
    colors: {
      background: '#fff',
      surface: '#fff',
      primary: { 500: '#3b82f6' },
      secondary: { 500: '#a855f7' },
      success: { 500: '#22c55e' },
      warning: { 500: '#f59e0b' },
      error: { 500: '#ef4444' },
      text: { primary: '#111', secondary: '#444', disabled: '#999', inverse: '#fff' },
      border: { default: '#e5e7eb', focus: '#93c5fd', error: '#fecaca' },
      neutral: { 200: '#eee' },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 28, xxxxl: 32 },
    typography: {
      fontSizes: { xs: 12, sm: 14, md: 16 },
      fontWeights: { regular: '400', medium: '500', bold: '700' },
      lineHeights: { sm: 18, md: 22 },
      letterSpacing: { tight: -0.2, normal: 0 },
    },
    borders: { radius: { sm: 4 }, width: { sm: 1 } },
    shadows: {},
  };
  return {
    Button,
    Card,
    CardContent,
    ButtonGroup,
    useTheme: () => ({ theme: lightTheme }),
    useEnhancedTheme: () => ({ theme: lightTheme, toggleTheme: () => {}, isDark: false }),
    lightTheme,
  };
});
