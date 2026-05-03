// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Avatar } from '../lib/components/Avatar';

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.png" alt="User avatar" />);
    const img = screen.getByAltText('User avatar') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
  });

  it('renders fallback when no src', () => {
    render(<Avatar alt="User initials">AB</Avatar>);
    expect(screen.getByRole('img', { name: 'User initials' })).toBeInTheDocument();
    expect(screen.getByText('AB')).toBeInTheDocument();
  });
});
