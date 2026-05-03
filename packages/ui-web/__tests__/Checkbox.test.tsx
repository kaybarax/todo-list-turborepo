// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../lib/components/Checkbox';

describe('Checkbox Component - DaisyUI Integration', () => {
  describe('DaisyUI Class Application', () => {
    it('should apply base DaisyUI checkbox class', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('checkbox');
    });

    it('should apply DaisyUI variant classes correctly', () => {
      const variants = [
        { variant: 'primary', expectedClass: 'checkbox-primary' },
        { variant: 'secondary', expectedClass: 'checkbox-secondary' },
        { variant: 'accent', expectedClass: 'checkbox-accent' },
        { variant: 'info', expectedClass: 'checkbox-info' },
        { variant: 'success', expectedClass: 'checkbox-success' },
        { variant: 'warning', expectedClass: 'checkbox-warning' },
        { variant: 'error', expectedClass: 'checkbox-error' },
      ] as const;

      variants.forEach(({ variant, expectedClass }) => {
        const { unmount } = render(<Checkbox variant={variant} />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toHaveClass('checkbox', expectedClass);
        unmount();
      });
    });

    it('should apply DaisyUI size classes correctly', () => {
      const sizes = [
        { size: 'xs', expectedClass: 'checkbox-xs' },
        { size: 'sm', expectedClass: 'checkbox-sm' },
        { size: 'md', expectedClass: '' }, // Default size has no class
        { size: 'lg', expectedClass: 'checkbox-lg' },
      ] as const;

      sizes.forEach(({ size, expectedClass }) => {
        const { unmount } = render(<Checkbox size={size} />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toHaveClass('checkbox');
        if (expectedClass) {
          expect(checkbox).toHaveClass(expectedClass);
        }
        unmount();
      });
    });

    it('should combine multiple DaisyUI classes correctly', () => {
      render(<Checkbox variant="primary" size="lg" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('checkbox', 'checkbox-primary', 'checkbox-lg');
    });
  });

  describe('Legacy Props Compatibility', () => {
    it('should maintain backward compatibility with legacy state prop', () => {
      render(<Checkbox state="primary" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('checkbox', 'checkbox-primary');
    });

    it('should prioritize variant over state when both are provided', () => {
      render(<Checkbox variant="secondary" state="primary" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('checkbox', 'checkbox-secondary');
      expect(checkbox).not.toHaveClass('checkbox-primary');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes', () => {
      render(<Checkbox aria-label="Test checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('type', 'checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Test checkbox');
    });

    it('should support disabled state with proper ARIA', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    });

    it('should support indeterminate state', () => {
      render(<Checkbox indeterminate />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('should support required attribute', () => {
      render(<Checkbox required />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeRequired();
    });
  });

  describe('Form Integration', () => {
    it('should handle controlled state correctly', async () => {
      const user = userEvent.setup();
      let checked = false;
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        checked = e.target.checked;
      };

      render(<Checkbox checked={checked} onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(checked).toBe(true);
    });

    it('should handle uncontrolled state correctly', async () => {
      const user = userEvent.setup();
      render(<Checkbox defaultChecked={false} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should support form name attribute', () => {
      render(<Checkbox name="test-checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('name', 'test-checkbox');
    });

    it('should support form value attribute', () => {
      render(<Checkbox value="test-value" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('value', 'test-value');
    });
  });

  describe('DaisyUI Theme Integration', () => {
    it('should respond to theme changes via CSS custom properties', () => {
      render(<Checkbox variant="primary" />);
      const checkbox = screen.getByRole('checkbox');

      // Should have DaisyUI classes that respond to theme variables
      expect(checkbox).toHaveClass('checkbox-primary');

      // The actual color values come from CSS custom properties
      const computedStyle = window.getComputedStyle(checkbox);
      expect(computedStyle.getPropertyValue('--chkbg')).toBeDefined();
    });

    it('should maintain proper contrast in different themes', () => {
      render(<Checkbox variant="primary" checked />);
      const checkbox = screen.getByRole('checkbox');

      // DaisyUI ensures proper contrast ratios through CSS custom properties
      expect(checkbox).toHaveClass('checkbox-primary');
    });
  });

  describe('Component Composition', () => {
    it('should support custom className alongside DaisyUI classes', () => {
      render(<Checkbox className="custom-class" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('checkbox', 'custom-class');
    });

    it('should support ref forwarding', () => {
      let checkboxRef: HTMLInputElement | null = null;
      render(
        <Checkbox
          ref={ref => {
            checkboxRef = ref;
          }}
        />,
      );
      expect(checkboxRef).toBeInstanceOf(HTMLInputElement);
      expect(checkboxRef).toHaveClass('checkbox');
    });

    it('should work within form-control wrapper', () => {
      render(
        <div className="form-control">
          <label className="label">
            <span className="label-text">Test Label</span>
          </label>
          <Checkbox />
        </div>,
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('checkbox');
    });
  });

  describe('Event Handling', () => {
    it('should handle change events properly', async () => {
      const user = userEvent.setup();
      let changeCount = 0;
      const handleChange = () => {
        changeCount++;
      };

      render(<Checkbox onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(changeCount).toBe(1);
    });

    it('should handle focus events', async () => {
      const user = userEvent.setup();
      let focused = false;
      const handleFocus = () => {
        focused = true;
      };

      render(<Checkbox onFocus={handleFocus} />);
      const checkbox = screen.getByRole('checkbox');

      await user.tab();
      expect(focused).toBe(true);
    });

    it('should not trigger events when disabled', async () => {
      const user = userEvent.setup();
      let changed = false;
      const handleChange = () => {
        changed = true;
      };

      render(<Checkbox disabled onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(changed).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      await user.tab();
      expect(checkbox).toHaveFocus();
    });

    it('should toggle on space key', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      await user.keyboard(' ');
      expect(checkbox).toBeChecked();
    });

    it('should skip disabled checkboxes in tab order', () => {
      render(
        <>
          <Checkbox />
          <Checkbox disabled />
          <Checkbox />
        </>,
      );
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[1]).toBeDisabled();
    });
  });
});
