import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../theme/ThemeToggle';
import { ThemeProvider } from '@/components/theme/theme-provider';

// Mock the theme context
const mockSetMode = jest.fn();
const mockSetTheme = jest.fn();

// Mock the useThemeContext hook
jest.mock('../theme/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useThemeContext: jest.fn(),
}));

const defaultThemeContext = {
  mode: 'light' as const,
  resolvedType: 'light' as const,
  theme: { name: 'light', displayName: 'Light', type: 'light' as const, daisyUITheme: 'light' as const },
  themes: [
    { name: 'light', displayName: 'Light', type: 'light' as const, daisyUITheme: 'light' as const },
    { name: 'dark', displayName: 'Dark', type: 'dark' as const, daisyUITheme: 'dark' as const },
    { name: 'cupcake', displayName: 'Cupcake', type: 'light' as const, daisyUITheme: 'cupcake' as const },
  ],
  daisyUITheme: 'light' as const,
  setMode: mockSetMode,
  setTheme: mockSetTheme,
  setDaisyUITheme: jest.fn(),
};

let mockThemeContext = { ...defaultThemeContext };

jest.mock('../theme/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useThemeContext: () => mockThemeContext,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset theme context to default state
    mockThemeContext = { ...defaultThemeContext };
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch to'));
    });

    it('should render with custom test id', () => {
      render(
        <TestWrapper>
          <ThemeToggle data-testid="custom-theme-toggle" />
        </TestWrapper>,
      );

      expect(screen.getByTestId('custom-theme-toggle')).toBeInTheDocument();
    });

    it('should render with label when showLabel is true', () => {
      render(
        <TestWrapper>
          <ThemeToggle showLabel={true} />
        </TestWrapper>,
      );

      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should render without label when showLabel is false', () => {
      render(
        <TestWrapper>
          <ThemeToggle showLabel={false} />
        </TestWrapper>,
      );

      expect(screen.queryByText('Light')).not.toBeInTheDocument();
    });
  });

  describe('Icon Variant', () => {
    it('should render icon variant correctly', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10', 'p-0');
    });

    it('should show correct icon for light theme', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" />
        </TestWrapper>,
      );

      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show correct icon for dark theme', () => {
      mockThemeContext = { ...mockThemeContext, mode: 'dark' as const, resolvedType: 'dark' as const } as any;

      render(
        <TestWrapper>
          <ThemeToggle variant="icon" />
        </TestWrapper>,
      );

      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Button Variant', () => {
    it('should render button variant with label', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="button" showLabel={true} />
        </TestWrapper>,
      );

      expect(screen.getByText('Light')).toBeInTheDocument();
    });
  });

  describe('Switch Variant', () => {
    it('should render switch variant', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="switch" showLabel={true} />
        </TestWrapper>,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveClass('toggle');
    });

    it('should be unchecked for light theme', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="switch" />
        </TestWrapper>,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should be checked for dark theme', () => {
      mockThemeContext = { ...mockThemeContext, resolvedType: 'dark' as const } as any;

      render(
        <TestWrapper>
          <ThemeToggle variant="switch" />
        </TestWrapper>,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Compact Variant', () => {
    it('should render compact variant with small text', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="compact" showLabel={true} />
        </TestWrapper>,
      );

      const text = screen.getByText('Light');
      expect(text).toHaveClass('text-xs');
    });
  });

  describe('Cycling Modes', () => {
    it('should cycle through modes when cycleThrough is "mode"', async () => {
      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="mode" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockSetMode).toHaveBeenCalledWith('dark');
      });
    });

    it('should toggle light/dark when cycleThrough is "lightDark"', async () => {
      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="lightDark" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockSetMode).toHaveBeenCalledWith('dark');
      });
    });

    it('should cycle through themes when cycleThrough is "themes"', async () => {
      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="themes" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith(mockThemeContext.themes[1]);
      });
    });
  });

  describe('Custom Icons', () => {
    it('should render custom icons when provided', () => {
      const customIcons = {
        light: <span data-testid="custom-light">🌞</span>,
        dark: <span data-testid="custom-dark">🌙</span>,
        system: <span data-testid="custom-system">💻</span>,
      };

      render(
        <TestWrapper>
          <ThemeToggle customIcons={customIcons} />
        </TestWrapper>,
      );

      expect(screen.getByTestId('custom-light')).toBeInTheDocument();
    });

    it('should show correct custom icon for system mode', () => {
      mockThemeContext = { ...mockThemeContext, mode: 'system' as const } as any;

      const customIcons = {
        light: <span data-testid="custom-light">🌞</span>,
        dark: <span data-testid="custom-dark">🌙</span>,
        system: <span data-testid="custom-system">💻</span>,
      };

      render(
        <TestWrapper>
          <ThemeToggle customIcons={customIcons} />
        </TestWrapper>,
      );

      expect(screen.getByTestId('custom-system')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should apply correct size classes', () => {
      const { rerender } = render(
        <TestWrapper>
          <ThemeToggle size="sm" />
        </TestWrapper>,
      );

      expect(screen.getByRole('button')).toHaveClass('btn-sm');

      rerender(
        <TestWrapper>
          <ThemeToggle size="lg" />
        </TestWrapper>,
      );

      expect(screen.getByRole('button')).toHaveClass('btn-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for mode cycling', () => {
      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="mode" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to Dark theme');
    });

    it('should have proper aria-label for light/dark toggle', () => {
      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="lightDark" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to Dark theme');
    });

    it('should have proper aria-label for theme cycling', () => {
      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="themes" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch theme');
    });

    it('should support keyboard interaction', async () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      button.focus();

      await userEvent.keyboard('{Enter}');
      expect(mockSetMode).toHaveBeenCalled();
    });

    it('should support keyboard interaction for switch variant', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="switch" />
        </TestWrapper>,
      );

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();

      await userEvent.keyboard(' ');
      expect(mockSetMode).toHaveBeenCalled();
    });
  });

  describe('Theme Labels', () => {
    it('should show correct label for current theme in theme cycling mode', () => {
      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="themes" showLabel={true} />
        </TestWrapper>,
      );

      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should show system label when in system mode', () => {
      mockThemeContext = { ...mockThemeContext, mode: 'system' as const } as any;

      render(
        <TestWrapper>
          <ThemeToggle showLabel={true} />
        </TestWrapper>,
      );

      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing theme gracefully', () => {
      const contextWithMissingTheme = {
        ...mockThemeContext,
        theme: { name: 'missing', displayName: undefined, type: 'light' as const },
        themes: [],
      };

      mockThemeContext = { ...contextWithMissingTheme } as any;

      expect(() => {
        render(
          <TestWrapper>
            <ThemeToggle cycleThrough="themes" />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it('should handle empty themes array', () => {
      const contextWithEmptyThemes = {
        ...mockThemeContext,
        themes: [],
      };

      mockThemeContext = { ...contextWithEmptyThemes } as any;

      render(
        <TestWrapper>
          <ThemeToggle cycleThrough="themes" />
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should handle gracefully - may call with undefined but shouldn't throw
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });
});
