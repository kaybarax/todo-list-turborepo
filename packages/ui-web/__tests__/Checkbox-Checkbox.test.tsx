// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Checkbox } from '../lib/components/Checkbox';

describe('Checkbox', () => {
  it('renders with label and helper text', () => {
    render(<Checkbox id="cb" label="Accept" helperText="Required" aria-label="Accept terms" />);
    expect(screen.getByLabelText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('applies size and state variants', () => {
    const { rerender } = render(<Checkbox id="c1" size="sm" label="L" aria-label="L" />);
    const input = screen.getByLabelText('L') as HTMLInputElement;
    expect(input).toHaveClass('checkbox-sm');

    rerender(<Checkbox id="c2" state="error" label="E" aria-label="E" />);
    const input2 = screen.getByLabelText('E') as HTMLInputElement;
    expect(input2).toHaveClass('checkbox-error');
  });

  it('supports indeterminate state with aria-checked mixed', () => {
    render(<Checkbox id="c3" label="All" indeterminate aria-label="All" />);
    const input = screen.getByLabelText('All');
    expect(input).toHaveAttribute('aria-checked', 'mixed');
  });
});
