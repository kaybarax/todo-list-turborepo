// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Input } from '../lib/components/Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('applies size variants', () => {
    const { rerender } = render(<Input placeholder="p" size="xs" />);
    expect(screen.getByPlaceholderText('p')).toHaveClass('input-xs');

    rerender(<Input placeholder="p" size="lg" />);
    expect(screen.getByPlaceholderText('p')).toHaveClass('input-lg');
  });

  it('applies state variants', () => {
    const { rerender } = render(<Input placeholder="p" state="default" />);
    expect(screen.getByPlaceholderText('p')).not.toHaveClass('input-error');

    rerender(<Input placeholder="p" state="error" />);
    expect(screen.getByPlaceholderText('p')).toHaveClass('input-error');

    rerender(<Input placeholder="p" state="success" />);
    expect(screen.getByPlaceholderText('p')).toHaveClass('input-success');
  });

  it('supports legacy error prop and sets aria-invalid', () => {
    render(<Input placeholder="p" error helperText="Required" id="email" />);
    const input = screen.getByPlaceholderText('p');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const helper = screen.getByText('Required');
    expect(helper).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('renders icons and adjusts padding', () => {
    render(<Input placeholder="p" leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />} />);
    expect(screen.getByTestId('left')).toBeInTheDocument();
    expect(screen.getByTestId('right')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('p');
    expect(input.className).toMatch(/pl-10/);
    expect(input.className).toMatch(/pr-10/);
  });
});
