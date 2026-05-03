// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Badge } from '../lib/components/Badge';

describe('Badge sizes', () => {
  it('applies size classes', () => {
    const { rerender } = render(<Badge size="xs">XS</Badge>);
    expect(screen.getByText('XS').parentElement!).toHaveClass('badge-xs');

    rerender(<Badge size="sm">SM</Badge>);
    expect(screen.getByText('SM').parentElement!).toHaveClass('badge-sm');

    rerender(<Badge size="md">MD</Badge>);
    expect(screen.getByText('MD').parentElement!).toHaveClass('badge-md');

    rerender(<Badge size="lg">LG</Badge>);
    expect(screen.getByText('LG').parentElement!).toHaveClass('badge-lg');
  });
});
