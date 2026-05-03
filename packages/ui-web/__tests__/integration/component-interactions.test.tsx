// @ts-nocheck
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Button } from '../../lib/components/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../lib/components/Card/Card';
import { Input } from '../../lib/components/Input/Input';
import { Badge } from '../../lib/components/Badge/Badge';

describe('Component Interactions', () => {
  describe('Form with Button and Input', () => {
    const FormComponent = () => {
      const [value, setValue] = useState('');
      const [submitted, setSubmitted] = useState(false);

      return (
        <div>
          <Input
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
            placeholder="Enter text"
            data-testid="form-input"
          />
          <Button onClick={() => setSubmitted(true)} disabled={!value} data-testid="submit-button">
            Submit
          </Button>
          {submitted && <div data-testid="success-message">Form submitted!</div>}
        </div>
      );
    };

    it('enables submit button when input has value', () => {
      render(<FormComponent />);

      const input = screen.getByTestId('form-input');
      const button = screen.getByTestId('submit-button');

      expect(button).toBeDisabled();

      fireEvent.change(input, { target: { value: 'test' } });
      expect(button).not.toBeDisabled();
    });

    it('shows success message when form is submitted', () => {
      render(<FormComponent />);

      const input = screen.getByTestId('form-input');
      const button = screen.getByTestId('submit-button');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(button);

      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  describe('Card with Interactive Elements', () => {
    const InteractiveCard = () => {
      const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

      const handleAction = () => {
        setStatus('loading');
        setTimeout(() => setStatus('success'), 100);
      };

      return (
        <Card data-testid="interactive-card">
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Badge variant={status === 'success' ? 'default' : 'secondary'}>Status: {status}</Badge>
              <Button onClick={handleAction} loading={status === 'loading'} disabled={status === 'success'}>
                {status === 'success' ? 'Completed' : 'Start Action'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    };

    it('updates badge and button state during interaction', async () => {
      render(<InteractiveCard />);

      const button = screen.getByRole('button');
      const badge = screen.getByText(/Status:/);

      expect(badge).toHaveTextContent('Status: idle');
      expect(button).toHaveTextContent('Start Action');

      fireEvent.click(button);

      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toBeInTheDocument(); // Loading spinner

      // Wait for async operation to complete
      await screen.findByText('Completed');

      expect(badge).toHaveTextContent('Status: success');
      expect(button).toHaveTextContent('Completed');
      expect(button).toBeDisabled();
    });
  });

  describe('Multiple Component Composition', () => {
    const CompositeComponent = () => {
      const [items, setItems] = useState<string[]>([]);
      const [inputValue, setInputValue] = useState('');

      const addItem = () => {
        if (inputValue.trim()) {
          setItems([...items, inputValue.trim()]);
          setInputValue('');
        }
      };

      const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
      };

      return (
        <Card>
          <CardHeader>
            <CardTitle>Item Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  placeholder="Add new item"
                  data-testid="item-input"
                />
                <Button onClick={addItem} data-testid="add-button">
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Badge variant="outline">{item}</Badge>
                    <Button variant="error" size="sm" onClick={() => removeItem(index)} data-testid={`remove-${index}`}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              {items.length === 0 && <p data-testid="empty-message">No items added yet</p>}
            </div>
          </CardContent>
        </Card>
      );
    };

    it('manages list of items with add and remove functionality', () => {
      render(<CompositeComponent />);

      const input = screen.getByTestId('item-input');
      const addButton = screen.getByTestId('add-button');

      expect(screen.getByTestId('empty-message')).toBeInTheDocument();

      // Add first item
      fireEvent.change(input, { target: { value: 'First item' } });
      fireEvent.click(addButton);

      expect(screen.getByText('First item')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-message')).not.toBeInTheDocument();
      expect(input).toHaveValue('');

      // Add second item
      fireEvent.change(input, { target: { value: 'Second item' } });
      fireEvent.click(addButton);

      expect(screen.getByText('Second item')).toBeInTheDocument();

      // Remove first item
      fireEvent.click(screen.getByTestId('remove-0'));

      expect(screen.queryByText('First item')).not.toBeInTheDocument();
      expect(screen.getByText('Second item')).toBeInTheDocument();

      // Remove last item
      fireEvent.click(screen.getByTestId('remove-0'));

      expect(screen.queryByText('Second item')).not.toBeInTheDocument();
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    });

    it('does not add empty items', () => {
      render(<CompositeComponent />);

      const input = screen.getByTestId('item-input');
      const addButton = screen.getByTestId('add-button');

      // Try to add empty item
      fireEvent.click(addButton);
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();

      // Try to add whitespace-only item
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(addButton);
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper focus management', () => {
      render(
        <div>
          <Button data-testid="first-button">First</Button>
          <Input data-testid="input" />
          <Button data-testid="second-button">Second</Button>
        </div>,
      );

      const firstButton = screen.getByTestId('first-button');
      const input = screen.getByTestId('input');
      const secondButton = screen.getByTestId('second-button');

      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Tab to next element
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      input.focus();
      expect(document.activeElement).toBe(input);

      // Tab to next element
      fireEvent.keyDown(input, { key: 'Tab' });
      secondButton.focus();
      expect(document.activeElement).toBe(secondButton);
    });

    it('supports keyboard navigation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Keyboard Button</Button>);

      const button = screen.getByRole('button');
      await user.tab(); // Focus the button

      // Enter key should trigger click
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Space key should trigger click
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });
});
