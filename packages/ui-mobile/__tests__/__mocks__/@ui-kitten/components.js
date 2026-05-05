// Mock for @ui-kitten/components compatible with React Native Testing Library
import React from 'react';

// Use string host components to avoid importing react-native before Jest mocks apply
const RNText = 'Text';
const TouchableOpacity = 'TouchableOpacity';
const View = 'View';
const TextInput = 'TextInput';

export const ApplicationProvider = ({ children }) => children;
export const IconRegistry = () => null;
export const useTheme = () => ({
  'text-basic-color': '#111827',
  'text-hint-color': '#6b7280',
  'text-disabled-color': '#9ca3af',
  'text-control-color': '#ffffff',
});
export const Button = ({
  children,
  onPress,
  testID,
  accessibilityLabel,
  disabled,
  loading,
  accessibilityRole,
  ...props
}) => {
  const handlePress = disabled || loading ? () => {} : onPress;
  return React.createElement(
    TouchableOpacity,
    { onPress: handlePress, testID, accessibilityLabel, disabled: disabled || loading, accessibilityRole, ...props },
    loading
      ? React.createElement(
          View,
          { testID: 'button-loading-indicator' },
          React.createElement(RNText, null, 'Loading...'),
        )
      : React.createElement(RNText, null, children),
  );
};
export const Text = ({ children, ...props }) => React.createElement(RNText, { ...props }, children);
export const Input = props => React.createElement(TextInput, props);
export const Layout = ({ children, ...props }) => React.createElement(View, props, children);
export const Card = ({ children, accessibilityRole, ...props }) =>
  React.createElement(View, { accessibilityRole, ...props }, children);
export const List = ({ children, ...props }) => React.createElement(View, props, children);
export const ListItem = ({ children, ...props }) => React.createElement(View, props, children);
export const Modal = ({ children, ...props }) => React.createElement(View, props, children);
export const Popover = ({ children, ...props }) => React.createElement(View, props, children);
export const Select = ({ children, ...props }) => React.createElement(View, props, children);
export const SelectItem = ({ children, ...props }) => React.createElement(View, props, children);
export const Toggle = props => React.createElement(View, props);
export const CheckBox = props => React.createElement(View, props);
export const Radio = props => React.createElement(View, props);
export const RadioGroup = ({ children, ...props }) => React.createElement(View, props, children);
export const Datepicker = props => React.createElement(View, props);
export const RangeDatepicker = props => React.createElement(View, props);
export const Autocomplete = props => React.createElement(TextInput, props);
export const Calendar = ({ children, ...props }) => React.createElement(View, props, children);
export const Drawer = ({ children, ...props }) => React.createElement(View, props, children);
export const Tab = ({ children, ...props }) => React.createElement(View, props, children);
export const TabView = ({ children, ...props }) => React.createElement(View, props, children);
export const TopNavigation = ({ children, ...props }) => React.createElement(View, props, children);
export const TopNavigationAction = ({ children, ...props }) => React.createElement(TouchableOpacity, props, children);
export const BottomNavigation = ({ children, ...props }) => React.createElement(View, props, children);
export const BottomNavigationTab = ({ children, ...props }) => React.createElement(View, props, children);
export const Menu = ({ children, ...props }) => React.createElement(View, props, children);
export const MenuItem = ({ children, ...props }) => React.createElement(View, props, children);
export const MenuGroup = ({ children, ...props }) => React.createElement(View, props, children);
export const OverflowMenu = ({ children, ...props }) => React.createElement(View, props, children);
export const Tooltip = ({ children, ...props }) => React.createElement(View, props, children);
export const Spinner = props => React.createElement(View, props);
export const Avatar = props => React.createElement(View, props);
export const Divider = props => React.createElement(View, props);
export const Icon = props => React.createElement(RNText, props);

export default {
  ApplicationProvider,
  IconRegistry,
  useTheme,
  Button,
  Text,
  Input,
  Layout,
  Card,
  List,
  ListItem,
  Modal,
  Popover,
  Select,
  SelectItem,
  Toggle,
  CheckBox,
  Radio,
  RadioGroup,
  Datepicker,
  RangeDatepicker,
  Autocomplete,
  Calendar,
  Drawer,
  Tab,
  TabView,
  TopNavigation,
  TopNavigationAction,
  BottomNavigation,
  BottomNavigationTab,
  Menu,
  MenuItem,
  MenuGroup,
  OverflowMenu,
  Tooltip,
  Spinner,
  Avatar,
  Divider,
  Icon,
};
