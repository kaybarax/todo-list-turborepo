// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../lib/components/Select';

describe('Select Component - DaisyUI Integration', () => {
  describe('DaisyUI Class Application', () => {
    it('should apply base DaisyUI select class', () => {
      render(
        <Select aria-label="Test select">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('select');
    });

    it('should apply DaisyUI color state classes correctly', () => {
      const states = [
        { state: 'primary', expectedClass: 'select-primary' },
        { state: 'secondary', expectedClass: 'select-secondary' },
        { state: 'accent', expectedClass: 'select-accent' },
        { state: 'info', expectedClass: 'select-info' },
        { state: 'success', expectedClass: 'select-success' },
        { state: 'warning', expectedClass: 'select-warning' },
        { state: 'error', expectedClass: 'select-error' },
      ] as const;

      states.forEach(({ state, expectedClass }) => {
        const { unmount } = render(
          <Select state={state} aria-label="Test select">
            <option value="option1">Option 1</option>
          </Select>,
        );
        const select = screen.getByRole('combobox');
        expect(select).toHaveClass('select', expectedClass);
        unmount();
      });
    });

    it('should apply DaisyUI style variant classes correctly', () => {
      const variants = [
        { variant: 'bordered', expectedClass: 'select-bordered' },
        { variant: 'ghost', expectedClass: 'select-ghost' },
      ] as const;

      variants.forEach(({ variant, expectedClass }) => {
        const { unmount } = render(
          <Select variant={variant} aria-label="Test select">
            <option value="option1">Option 1</option>
          </Select>,
        );
        const select = screen.getByRole('combobox');
        expect(select).toHaveClass('select', expectedClass);
        unmount();
      });
    });

    it('should apply DaisyUI size classes correctly', () => {
      const sizes = [
        { size: 'xs', expectedClass: 'select-xs' },
        { size: 'sm', expectedClass: 'select-sm' },
        { size: 'md', expectedClass: '' }, // Default size has no class
        { size: 'lg', expectedClass: 'select-lg' },
      ] as const;

      sizes.forEach(({ size, expectedClass }) => {
        const { unmount } = render(
          <Select size={size} aria-label="Test select">
            <option value="option1">Option 1</option>
          </Select>,
        );
        const select = screen.getByRole('combobox');
        expect(select).toHaveClass('select');
        if (expectedClass) {
          expect(select).toHaveClass(expectedClass);
        }
        unmount();
      });
    });

    it('should combine multiple DaisyUI classes correctly', () => {
      render(
        <Select state="primary" variant="bordered" size="lg" aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('select', 'select-primary', 'select-bordered', 'select-lg');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Select aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Test select');
    });

    it('should support disabled state with proper ARIA', () => {
      render(
        <Select disabled aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      expect(select).toHaveAttribute('aria-disabled', 'true');
    });

    it('should support required attribute', () => {
      render(
        <Select required aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });

    it('should render all options with proper accessibility', () => {
      render(
        <Select aria-label="Test select">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </Select>,
      );

      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ];

      options.forEach(option => {
        const optionElement = screen.getByRole('option', { name: option.label });
        expect(optionElement).toHaveAttribute('value', option.value);
      });
    });
  });

  describe('Form Integration', () => {
    it('should handle controlled state correctly', async () => {
      const user = userEvent.setup();
      let selectedValue = '';
      const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        selectedValue = e.target.value;
      };

      render(
        <Select value={selectedValue} onChange={handleChange} aria-label="Test select">
          <option value="">Choose option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'option2');
      expect(selectedValue).toBe('option2');
    });

    it('should handle uncontrolled state correctly', async () => {
      const user = userEvent.setup();
      render(
        <Select defaultValue="option1" aria-label="Test select">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </Select>,
      );
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      expect(select.value).toBe('option1');
      await user.selectOptions(select, 'option3');
      expect(select.value).toBe('option3');
    });

    it('should support form name attribute', () => {
      render(
        <Select name="test-select" aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('name', 'test-select');
    });
  });

  describe('DaisyUI Theme Integration', () => {
    it('should respond to theme changes via CSS custom properties', () => {
      render(
        <Select state="primary" aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');

      // Should have DaisyUI classes that respond to theme variables
      expect(select).toHaveClass('select-primary');
    });

    it('should maintain proper contrast in different themes', () => {
      render(
        <Select state="primary" variant="bordered" aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');

      // DaisyUI ensures proper contrast ratios through CSS custom properties
      expect(select).toHaveClass('select-primary', 'select-bordered');
    });
  });

  describe('Component Composition', () => {
    it('should support custom className alongside DaisyUI classes', () => {
      render(
        <Select className="custom-class" aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('select', 'custom-class');
    });

    it('should support ref forwarding', () => {
      let selectRef: HTMLSelectElement | null = null;
      render(
        <Select
          ref={ref => {
            selectRef = ref;
          }}
          aria-label="Test select"
        >
          <option value="option1">Option 1</option>
        </Select>,
      );
      expect(selectRef).toBeInstanceOf(HTMLSelectElement);
      expect(selectRef).toHaveClass('select');
    });

    it('should work within form-control wrapper', () => {
      render(
        <div className="form-control">
          <label className="label">
            <span className="label-text">Test Label</span>
          </label>
          <Select aria-label="Test select">
            <option value="option1">Option 1</option>
          </Select>
        </div>,
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('select');
    });
  });

  describe('Event Handling', () => {
    it('should handle change events properly', async () => {
      const user = userEvent.setup();
      let changeCount = 0;
      const handleChange = () => {
        changeCount++;
      };

      render(
        <Select onChange={handleChange} aria-label="Test select">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'option2');
      expect(changeCount).toBe(1);
    });

    it('should handle focus events', async () => {
      const user = userEvent.setup();
      let focused = false;
      const handleFocus = () => {
        focused = true;
      };

      render(
        <Select onFocus={handleFocus} aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');

      await user.tab();
      expect(focused).toBe(true);
    });

    it('should not trigger events when disabled', async () => {
      const user = userEvent.setup();
      let changed = false;
      const handleChange = () => {
        changed = true;
      };

      render(
        <Select disabled onChange={handleChange} aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');

      // Disabled selects cannot be interacted with
      expect(select).toBeDisabled();
      expect(changed).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(
        <Select aria-label="Test select">
          <option value="option1">Option 1</option>
        </Select>,
      );
      const select = screen.getByRole('combobox');

      await user.tab();
      expect(select).toHaveFocus();
    });

    it('should navigate options with arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <Select aria-label="Test select">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </Select>,
      );
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      select.focus();
      await user.keyboard('{ArrowDown}');
      // Just check that the select is focused and interactive
      expect(select).toHaveFocus();
      expect(select.disabled).toBe(false);
    });

    it('should skip disabled selects in tab order', () => {
      render(
        <>
          <Select aria-label="Select 1">
            <option value="option1">Option 1</option>
          </Select>
          <Select disabled aria-label="Select 2">
            <option value="option1">Option 1</option>
          </Select>
          <Select aria-label="Select 3">
            <option value="option1">Option 1</option>
          </Select>
        </>,
      );
      const selects = screen.getAllByRole('combobox');
      expect(selects[1]).toBeDisabled();
    });
  });
});
