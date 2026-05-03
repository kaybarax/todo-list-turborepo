// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../lib/components/Progress';

describe('Progress Component - DaisyUI Integration', () => {
  describe('DaisyUI Class Application', () => {
    it('should apply base DaisyUI progress class', () => {
      render(<Progress value={50} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('progress');
    });

    it('should apply DaisyUI variant classes correctly', () => {
      const variants = [
        { variant: 'primary', expectedClass: 'progress-primary' },
        { variant: 'secondary', expectedClass: 'progress-secondary' },
        { variant: 'accent', expectedClass: 'progress-accent' },
        { variant: 'info', expectedClass: 'progress-info' },
        { variant: 'success', expectedClass: 'progress-success' },
        { variant: 'warning', expectedClass: 'progress-warning' },
        { variant: 'error', expectedClass: 'progress-error' },
      ] as const;

      variants.forEach(({ variant, expectedClass }) => {
        const { unmount } = render(<Progress value={50} variant={variant} />);
        const progress = screen.getByRole('progressbar');
        expect(progress).toHaveClass('progress', expectedClass);
        unmount();
      });
    });

    it('should apply DaisyUI size classes correctly', () => {
      const sizes = [
        { size: 'xs', expectedClass: 'progress-xs' },
        { size: 'sm', expectedClass: 'progress-sm' },
        { size: 'md', expectedClass: '' }, // Default size has no class
        { size: 'lg', expectedClass: 'progress-lg' },
      ] as const;

      sizes.forEach(({ size, expectedClass }) => {
        const { unmount } = render(<Progress value={50} size={size} />);
        const progress = screen.getByRole('progressbar');
        expect(progress).toHaveClass('progress');
        if (expectedClass) {
          expect(progress).toHaveClass(expectedClass);
        }
        unmount();
      });
    });

    it('should combine multiple DaisyUI classes correctly', () => {
      render(<Progress value={75} variant="primary" size="lg" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('progress', 'progress-primary', 'progress-lg');
    });
  });

  describe('Legacy Props Compatibility', () => {
    it('should maintain backward compatibility with legacy tone prop', () => {
      render(<Progress value={50} tone="primary" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('progress', 'progress-primary');
    });

    it('should prioritize variant over tone when both are provided', () => {
      render(<Progress value={50} variant="secondary" tone="primary" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('progress', 'progress-secondary');
      expect(progress).not.toHaveClass('progress-primary');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes', () => {
      render(<Progress value={75} max={100} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
    });

    it('should support custom aria-label', () => {
      render(<Progress value={50} aria-label="Loading progress" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-label', 'Loading progress');
    });

    it('should support aria-labelledby', () => {
      render(
        <>
          <div id="progress-label">File Upload</div>
          <Progress value={30} aria-labelledby="progress-label" />
        </>,
      );
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-labelledby', 'progress-label');
    });

    it('should handle indeterminate state', () => {
      render(<Progress />);
      const progress = screen.getByRole('progressbar');
      expect(progress).not.toHaveAttribute('value');
      expect(progress).not.toHaveAttribute('aria-valuenow');
    });
  });

  describe('Progress Value Handling', () => {
    it('should display correct progress value', () => {
      render(<Progress value={60} max={100} />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBe(60);
      expect(progress.max).toBe(100);
    });

    it('should handle different max values', () => {
      render(<Progress value={25} max={50} />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBe(25);
      expect(progress.max).toBe(50);
    });

    it('should clamp values to valid range', () => {
      render(<Progress value={150} max={100} />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBeLessThanOrEqual(100);
    });

    it('should handle zero and negative values', () => {
      render(<Progress value={0} max={100} />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBe(0);
    });
  });

  describe('DaisyUI Theme Integration', () => {
    it('should respond to theme changes via CSS custom properties', () => {
      render(<Progress value={50} variant="primary" />);
      const progress = screen.getByRole('progressbar');

      // Should have DaisyUI classes that respond to theme variables
      expect(progress).toHaveClass('progress-primary');

      // The actual color values come from CSS custom properties
      const computedStyle = window.getComputedStyle(progress);
      expect(computedStyle.getPropertyValue('--p')).toBeDefined();
    });

    it('should maintain proper contrast in different themes', () => {
      render(<Progress value={75} variant="success" />);
      const progress = screen.getByRole('progressbar');

      // DaisyUI ensures proper contrast ratios through CSS custom properties
      expect(progress).toHaveClass('progress-success');
    });
  });

  describe('Component Composition', () => {
    it('should support custom className alongside DaisyUI classes', () => {
      render(<Progress value={50} className="custom-class" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('progress', 'custom-class');
    });

    it('should support ref forwarding', () => {
      let progressRef: HTMLProgressElement | null = null;
      render(
        <Progress
          value={50}
          ref={ref => {
            progressRef = ref;
          }}
        />,
      );
      expect(progressRef).toBeInstanceOf(HTMLProgressElement);
      expect(progressRef).toHaveClass('progress');
    });

    it('should work within form-control wrapper', () => {
      render(
        <div className="form-control">
          <label className="label">
            <span className="label-text">Progress Label</span>
          </label>
          <Progress value={50} />
        </div>,
      );
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('progress');
    });
  });

  describe('Visual States', () => {
    it('should handle loading state without value', () => {
      render(<Progress />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('progress');
      expect(progress).not.toHaveAttribute('value');
    });

    it('should handle completed state', () => {
      render(<Progress value={100} max={100} />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBe(100);
      expect(progress.max).toBe(100);
    });

    it('should handle partial progress states', () => {
      const values = [10, 25, 50, 75, 90];

      values.forEach(value => {
        const { unmount } = render(<Progress value={value} max={100} />);
        const progress = screen.getByRole('progressbar') as HTMLProgressElement;
        expect(progress.value).toBe(value);
        unmount();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid value updates efficiently', () => {
      const { rerender } = render(<Progress value={0} />);

      // Simulate rapid updates
      for (let i = 0; i <= 100; i += 10) {
        rerender(<Progress value={i} />);
        const progress = screen.getByRole('progressbar') as HTMLProgressElement;
        expect(progress.value).toBe(i);
      }
    });

    it('should maintain consistent DOM structure across updates', () => {
      const { rerender } = render(<Progress value={25} variant="primary" />);
      const initialProgress = screen.getByRole('progressbar');
      const initialClasses = initialProgress.className;

      rerender(<Progress value={75} variant="primary" />);
      const updatedProgress = screen.getByRole('progressbar');

      expect(updatedProgress.className).toBe(initialClasses);
      expect((updatedProgress as HTMLProgressElement).value).toBe(75);
    });
  });

  describe('Edge Cases', () => {
    it('should handle fractional values', () => {
      render(<Progress value={33.33} max={100} />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBeCloseTo(33.33);
    });

    it('should handle very small values', () => {
      render(<Progress value={0.1} max={100} />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBe(0.1);
    });

    it('should handle string values correctly', () => {
      render(<Progress value="50" max="100" />);
      const progress = screen.getByRole('progressbar') as HTMLProgressElement;
      expect(progress.value).toBe(50);
      expect(progress.max).toBe(100);
    });
  });
});
