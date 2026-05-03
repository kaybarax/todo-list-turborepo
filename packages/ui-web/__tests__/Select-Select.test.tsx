// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Select } from '../lib/components/Select';

function options() {
  return (
    <>
      <option value="">Choose</option>
      <option value="a">A</option>
      <option value="b">B</option>
    </>
  );
}

describe('Select', () => {
  it('renders with aria-label for accessible name', () => {
    render(
      <Select aria-label="letters" data-testid="sel">
        {options()}
      </Select>,
    );
    const el = screen.getByTestId('sel');
    expect(el).toHaveAttribute('aria-label', 'letters');
  });

  it('applies size variants', () => {
    const { rerender } = render(
      <Select aria-label="s" size="xs">
        {options()}
      </Select>,
    );
    const el = screen.getByLabelText('s');
    expect(el).toHaveClass('select-xs');

    rerender(
      <Select aria-label="s" size="lg">
        {options()}
      </Select>,
    );
    const el2 = screen.getByLabelText('s');
    expect(el2).toHaveClass('select-lg');
  });

  it('applies state variants and sets aria-invalid only when error', () => {
    const { rerender } = render(<Select aria-label="state">{options()}</Select>);
    const base = screen.getByLabelText('state');
    expect(base.hasAttribute('aria-invalid')).toBe(false);

    rerender(
      <Select aria-label="state" state="error" helperText="Pick one" id="letters">
        {options()}
      </Select>,
    );
    const err = screen.getByLabelText('state');
    expect(err).toHaveAttribute('aria-invalid', 'true');
    expect(err).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('supports multiple selection', () => {
    render(
      <Select aria-label="multi" multiple>
        {options()}
      </Select>,
    );
    const el = screen.getByLabelText('multi');
    expect(el).toHaveAttribute('multiple');
  });
});
