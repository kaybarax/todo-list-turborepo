// @ts-nocheck
import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Custom render function with providers
const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <div data-theme="light">{children}</div>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Accessibility testing helper
export const testA11y = async (component: React.ReactElement) => {
  const { container } = customRender(component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
  return { container };
};

// Performance testing helper
export const testPerformance = (component: React.ReactElement, name: string) => {
  const startTime = performance.now();
  customRender(component);
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  // Log performance metrics
  console.log(`${name} render time: ${renderTime.toFixed(2)}ms`);

  // Assert reasonable render time (adjust threshold as needed)
  expect(renderTime).toBeLessThan(100);

  return renderTime;
};

// Keyboard navigation testing helper
export const testKeyboardNavigation = async (element: HTMLElement, keys: string[]) => {
  for (const key of keys) {
    element.focus();
    const event = new KeyboardEvent('keydown', { key });
    element.dispatchEvent(event);
  }
};

export * from '@testing-library/react';
export { customRender as render };
export { axe };
