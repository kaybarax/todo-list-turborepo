// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { IconButton } from '../lib/components/IconButton/IconButton';

describe('IconButton', () => {
  it('renders correctly', () => {
    render(<IconButton>🔍</IconButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<IconButton onClick={handleClick}>🔍</IconButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<IconButton variant="default">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton variant="destructive">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton variant="outline">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton variant="secondary">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton variant="ghost">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton variant="link">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<IconButton size="default">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton size="sm">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton size="lg">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');

    rerender(<IconButton size="xs">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square');
  });

  it('renders as a span when asChild is true', () => {
    render(<IconButton asChild>🔍</IconButton>);
    expect(screen.getByText('🔍').tagName).toBe('SPAN');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<IconButton disabled>🔍</IconButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<IconButton className="custom-class">🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('passes through HTML attributes', () => {
    render(
      <IconButton id="test-id" type="submit" aria-label="Search button" data-testid="icon-button">
        🔍
      </IconButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('id', 'test-id');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Search button');
    expect(button).toHaveAttribute('data-testid', 'icon-button');
  });

  it('renders with icon content', () => {
    const Icon = () => <svg data-testid="icon">test</svg>;
    render(
      <IconButton>
        <Icon />
      </IconButton>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('handles keyboard events', () => {
    const handleKeyDown = vi.fn();
    render(<IconButton onKeyDown={handleKeyDown}>🔍</IconButton>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('maintains aspect ratio with padding', () => {
    render(<IconButton>🔍</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('aspect-square', 'p-2');
  });

  it('works in form context', () => {
    const handleSubmit = vi.fn(e => e.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <IconButton type="submit">🔍</IconButton>
      </form>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('supports focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    render(
      <IconButton onFocus={handleFocus} onBlur={handleBlur}>
        🔍
      </IconButton>,
    );

    const button = screen.getByRole('button');
    fireEvent.focus(button);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(button);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});
