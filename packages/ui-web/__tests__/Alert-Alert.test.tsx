// @ts-nocheck
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { Alert } from '../lib/components/Alert';

describe('Alert', () => {
  it('renders with role alert and content', () => {
    render(<Alert title="Notice" description="Hello" />);
    const el = screen.getByRole('alert');
    expect(el).toBeInTheDocument();
    expect(screen.getByText('Notice')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('supports dismiss action', () => {
    const onDismiss = vi.fn();
    render(<Alert title="Dismiss me" dismissible onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
