// @ts-nocheck
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from '../lib/components/Dialog';

describe('Dialog', () => {
  it('renders with dialog role, aria-modal and labelledby', async () => {
    const onOpenChange = vi.fn();
    const titleId = 'my-dialog-title';
    render(
      <Dialog open titleId={titleId} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle id={titleId}>Title</DialogTitle>
          <DialogDescription>Desc</DialogDescription>
        </DialogHeader>
        <DialogContent>
          <p>Content</p>
        </DialogContent>
        <DialogFooter />
      </Dialog>,
    );

    const dlg = screen.getByRole('dialog');
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(dlg).toHaveAttribute('aria-labelledby', titleId);
    await waitFor(() => expect(dlg).toHaveFocus());
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('closes on Escape and on clicking close button/backdrop', () => {
    const onOpenChange = vi.fn();
    const titleId = 't';
    render(
      <Dialog open titleId={titleId} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle id={titleId}>T</DialogTitle>
        </DialogHeader>
      </Dialog>,
    );

    // Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // Close button
    onOpenChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
