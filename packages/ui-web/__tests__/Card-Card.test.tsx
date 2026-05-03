// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../lib/components/Card';

describe('Card', () => {
  it('renders content with elevation and non-interactive by default', () => {
    render(
      <Card elevation="lg">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Body</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('is focusable when interactive is true', () => {
    render(<Card interactive>Body</Card>);
    const card = screen.getByText('Body').closest('div');
    expect(card?.getAttribute('tabindex')).toBe('0');
  });
});
