import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

it('TodoFilters: renders and updates filters', () => {
  jest.resetModules();
  const tokensModule = require('../src/hooks/useDesignTokens');
  jest.spyOn(tokensModule, 'useDesignTokens').mockReturnValue({
    colors: {
      border: { default: '#ddd' },
      text: { primary: '#111', secondary: '#444', disabled: '#999', inverse: '#fff' },
      surface: '#fff',
    },
    spacing: { xs: 4, sm: 8, md: 12 },
    typography: { fontSize: { sm: 14 } },
  });

  const { TodoFilters } = require('../src/components/TodoFilters');

  const onSearchChange = jest.fn();
  const onPriorityChange = jest.fn();
  const onStatusChange = jest.fn();
  const onClear = jest.fn();

  const { getByPlaceholderText, getByText } = render(
    <TodoFilters
      search="hello"
      onSearchChange={onSearchChange}
      priority="all"
      onPriorityChange={onPriorityChange}
      status="all"
      onStatusChange={onStatusChange}
      onClear={onClear}
    />,
  );

  const input = getByPlaceholderText('Search title, description, or #tag');
  fireEvent.changeText(input, 'new');
  expect(onSearchChange).toHaveBeenCalledWith('new');

  fireEvent.press(getByText('Low'));
  expect(onPriorityChange).toHaveBeenCalledWith('low');

  fireEvent.press(getByText('Completed'));
  expect(onStatusChange).toHaveBeenCalledWith('completed');

  fireEvent.press(getByText('Clear filters'));
  expect(onSearchChange).toHaveBeenLastCalledWith('');
  expect(onPriorityChange).toHaveBeenLastCalledWith('all');
  expect(onStatusChange).toHaveBeenLastCalledWith('all');
  expect(onClear).toHaveBeenCalled();
});
