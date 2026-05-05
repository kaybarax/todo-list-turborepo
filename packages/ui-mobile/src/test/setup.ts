// Mock React Native components
/* eslint-disable no-undef */
import '@testing-library/jest-dom';

(globalThis as any).__DEV__ = false;

jest.mock('react-native', () => ({
  // Mock components
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  Image: 'Image',
  ScrollView: 'ScrollView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  FlatList: 'FlatList',
  SectionList: 'SectionList',
  ActivityIndicator: 'ActivityIndicator',
  Switch: 'Switch',
  Modal: 'Modal',
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  StatusBar: 'StatusBar',

  // Mock StyleSheet
  StyleSheet: {
    create: jest.fn(styles => styles),
    absoluteFillObject: {},
    hairlineWidth: 1,
    flatten: jest.fn(style => {
      if (Array.isArray(style)) {
        return Object.assign({}, ...style.filter(Boolean));
      }
      return style || {};
    }),
  },

  // Mock Appearance
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },

  // Mock Dimensions
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },

  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    roundToNearestPixel: jest.fn(n => n),
  },

  // Mock Platform
  Platform: {
    OS: 'ios',
    Version: '14.0',
    select: jest.fn((obj: any) => obj.ios ?? obj.default),
  },

  // Mock Animated
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Value: jest.fn(() => ({ setValue: jest.fn(), addListener: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
    parallel: jest.fn(() => ({ start: jest.fn() })),
  },

  // Mock other common APIs
  Alert: {
    alert: jest.fn(),
  },

  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
  clear: jest.fn(async () => undefined),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/FontAwesome', () => 'FontAwesome');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// react-native-reanimated is mapped via moduleNameMapper to a lightweight mock

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: 'SafeAreaView',
}));

// Suppress noisy deprecation warning from transitively used react-test-renderer while we
// retain @testing-library/react-native (pending upstream migration). Keep other errors.
const originalError = console.error;
console.error = (...args: any[]) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('react-test-renderer is deprecated')) {
    return; // swallow just this known warning
  }
  originalError(...args);
};
