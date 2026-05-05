import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../src/store/todoStore', () => ({
  useTodoStore: () => ({ todos: [] }),
}));

it('TodoForm: validates, cancels, and submits', () => {
  const tokensModule = require('../src/hooks/useDesignTokens');
  jest.spyOn(tokensModule, 'useDesignTokens').mockReturnValue({
    colors: {
      border: { default: '#ddd', error: '#f00' },
      text: { primary: '#111', secondary: '#444', disabled: '#999', inverse: '#fff' },
      surface: '#fff',
      error: '#f00',
    },
    spacing: { xs: 4, sm: 8, md: 12 },
    typography: { fontSize: { sm: 14 } },
  });

  const { TodoForm } = require('../src/components/TodoForm');
  const onSubmit = jest.fn();
  const onCancel = jest.fn();

  const { getByLabelText, getByText, queryByText } = render(<TodoForm onSubmit={onSubmit} onCancel={onCancel} />);

  // Initially empty title should show error on blur
  const title = getByLabelText('Todo title');
  fireEvent(title, 'blur');
  expect(getByText('Title is required')).toBeTruthy();

  // Typing invalid date should show error on blur
  const due = getByLabelText('Due date');
  fireEvent.changeText(due, '2025-13-40');
  fireEvent(due, 'blur');
  expect(getByText('Use format YYYY-MM-DD')).toBeTruthy();

  // Fix values
  fireEvent.changeText(title, 'Write tests');
  fireEvent.changeText(due, '2025-09-24');
  expect(queryByText('Title is required')).toBeNull();
  expect(queryByText('Use format YYYY-MM-DD')).toBeNull();

  // Submit
  fireEvent.press(getByLabelText('Save todo'));
  expect(onSubmit).toHaveBeenCalledWith({
    title: 'Write tests',
    description: '',
    priority: 'medium',
    dueDate: '2025-09-24',
    tags: [],
  });

  // Cancel
  fireEvent.press(getByLabelText('Cancel'));
  expect(onCancel).toHaveBeenCalled();
});
