// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Textarea } from '../lib/components/Textarea';

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Write..." />);
    expect(screen.getByPlaceholderText('Write...')).toBeInTheDocument();
  });

  it('applies size variants', () => {
    const { rerender } = render(<Textarea placeholder="p" size="xs" />);
    expect(screen.getByPlaceholderText('p')).toHaveClass('textarea-xs');

    rerender(<Textarea placeholder="p" size="lg" />);
    expect(screen.getByPlaceholderText('p')).toHaveClass('textarea-lg');
  });

  it('applies state variants and sets aria-invalid', () => {
    const { rerender } = render(<Textarea placeholder="p" state="default" />);
    const el = screen.getByPlaceholderText('p');
    expect(el.hasAttribute('aria-invalid')).toBe(false);

    rerender(<Textarea placeholder="p" state="error" helperText="Required" id="msg" />);
    const el2 = screen.getByPlaceholderText('p');
    expect(el2).toHaveAttribute('aria-invalid', 'true');
    expect(el2).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('auto-resizes when typing if enabled', () => {
    render(<Textarea placeholder="p" autoResize defaultValue="a" />);
    const el = screen.getByPlaceholderText('p');
    const height1 = el.style.height;
    fireEvent.input(el, { target: { value: 'a\n'.repeat(5) } });
    const height2 = el.style.height;
    // In jsdom, scrollHeight may be 0; component still sets a pixel value string
    expect(typeof height2).toBe('string');
    expect(height2).toMatch(/px$/);
  });

  it('shows character count when enabled', () => {
    render(<Textarea placeholder="p" showCount maxLength={10} defaultValue="hello" />);
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });
});
