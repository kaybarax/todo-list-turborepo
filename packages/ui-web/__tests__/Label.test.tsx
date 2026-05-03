// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { Label } from '../lib/components/Label/Label';

describe('Label', () => {
  it('renders correctly', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Label className="test-class">Test Label</Label>);
    expect(screen.getByText('Test Label')).toHaveClass('test-class');
  });

  it('applies default label styles', () => {
    render(<Label>Test Label</Label>);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
    expect(label).toHaveClass('leading-none');
  });

  it('renders as a label element', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label').tagName).toBe('LABEL');
  });

  it('passes through HTML attributes', () => {
    render(
      <Label id="test-id" htmlFor="input-id" aria-label="test-aria-label" data-testid="test-label">
        Test Label
      </Label>,
    );
    const label = screen.getByText('Test Label');
    expect(label).toHaveAttribute('id', 'test-id');
    expect(label).toHaveAttribute('for', 'input-id');
    expect(label).toHaveAttribute('aria-label', 'test-aria-label');
    expect(label).toHaveAttribute('data-testid', 'test-label');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Label onClick={handleClick}>Clickable Label</Label>);
    fireEvent.click(screen.getByText('Clickable Label'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('works with form inputs', () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Input Label</Label>
        <input id="test-input" type="text" title="test-title" />
      </div>,
    );

    const label = screen.getByText('Test Input Label');
    const input = screen.getByRole('textbox');

    expect(label).toHaveAttribute('for', 'test-input');
    expect(input).toHaveAttribute('id', 'test-input');

    // Clicking the label should focus the input
    fireEvent.click(label);
    expect(input).toHaveFocus();
  });

  it('supports nested elements', () => {
    render(
      <Label>
        <span>Required</span> Field
      </Label>,
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Field')).toBeInTheDocument();
  });

  it('handles disabled state styling', () => {
    render(
      <div>
        <Label htmlFor="disabled-input" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Disabled Label
        </Label>
        <input id="disabled-input" type="text" title="test-title" disabled className="peer" />
      </div>,
    );

    const label = screen.getByText('Disabled Label');
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
    expect(label).toHaveClass('peer-disabled:opacity-70');
  });

  it('supports keyboard navigation', () => {
    const handleKeyDown = vi.fn();
    render(<Label onKeyDown={handleKeyDown}>Keyboard Label</Label>);
    fireEvent.keyDown(screen.getByText('Keyboard Label'), { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('renders with complex content', () => {
    render(
      <Label>
        <strong>Bold</strong> and <em>italic</em> text
      </Label>,
    );
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return (element?.tagName === 'LABEL' && element?.textContent?.includes('and')) ?? false;
      }),
    ).toBeInTheDocument();
  });

  it('maintains accessibility with screen readers', () => {
    render(<Label aria-describedby="help-text">Accessible Label</Label>);
    expect(screen.getByText('Accessible Label')).toHaveAttribute('aria-describedby', 'help-text');
  });
});
