// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Progress } from '../lib/components/Progress';

describe('Progress', () => {
  it('renders with role progressbar and correct aria values', () => {
    render(<Progress value={50} min={0} max={100} />);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuemin', '0');
    expect(el).toHaveAttribute('aria-valuemax', '100');
    expect(el).toHaveAttribute('aria-valuenow', '50');
  });
});
