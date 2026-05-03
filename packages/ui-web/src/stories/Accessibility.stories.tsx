// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Button } from '../../lib/components/Button/Button';
import { Input } from '../../lib/components/Input/Input';
import { Dropdown } from '../../lib/components/Dropdown/Dropdown';
import { Tabs } from '../../lib/components/Tabs/Tabs';

const meta: Meta = {
  title: 'Foundation/Accessibility',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Accessibility features and keyboard navigation patterns for all design system components.',
      },
    },
  },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">Keyboard Navigation Patterns</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Buttons</h4>
            <p className="text-sm opacity-70 mb-3">
              • <kbd>Enter</kbd> or <kbd>Space</kbd> - Activate button • <kbd>Tab</kbd> - Move to next focusable element
            </p>
            <div className="flex gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Form Controls</h4>
            <p className="text-sm opacity-70 mb-3">
              • <kbd>Tab</kbd> - Navigate between fields • <kbd>Shift + Tab</kbd> - Navigate backwards •{' '}
              <kbd>Enter</kbd> - Submit form (on submit button)
            </p>
            <div className="space-y-3 max-w-sm">
              <Input placeholder="First Name" />
              <Input placeholder="Email" type="email" />
              <Button>Submit</Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Dropdown Menus</h4>
            <p className="text-sm opacity-70 mb-3">
              • <kbd>Enter</kbd> or <kbd>Space</kbd> - Open/close menu • <kbd>↑</kbd> <kbd>↓</kbd> - Navigate menu items
              • <kbd>Home</kbd> / <kbd>End</kbd> - First/last item • <kbd>Escape</kbd> - Close menu
            </p>
            <Dropdown
              items={[
                { id: 'profile', label: 'Profile' },
                { id: 'settings', label: 'Settings' },
                { id: 'logout', label: 'Logout' },
              ]}
              label="Account Menu"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Tab Navigation</h4>
            <p className="text-sm opacity-70 mb-3">
              • <kbd>←</kbd> <kbd>→</kbd> - Navigate between tabs • <kbd>Home</kbd> / <kbd>End</kbd> - First/last tab •{' '}
              <kbd>Enter</kbd> or <kbd>Space</kbd> - Activate tab
            </p>
            <Tabs
              items={[
                { id: 'accessibility', label: 'Accessibility', content: 'Focus management and ARIA attributes' },
                { id: 'keyboard', label: 'Keyboard', content: 'Keyboard navigation patterns' },
                { id: 'screenreader', label: 'Screen Reader', content: 'Screen reader compatibility' },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  ),
};

export const ARIAAttributes: Story = {
  render: () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">ARIA Attributes Reference</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Common ARIA Roles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">button</code>
                <p className="mt-1 opacity-70">Interactive element that triggers an action</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">menu</code>
                <p className="mt-1 opacity-70">List of options or commands</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">menuitem</code>
                <p className="mt-1 opacity-70">Individual option in a menu</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">tab</code>
                <p className="mt-1 opacity-70">Tab in a tab list</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">tabpanel</code>
                <p className="mt-1 opacity-70">Content panel for a tab</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">dialog</code>
                <p className="mt-1 opacity-70">Modal dialog or popup</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">State Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-expanded</code>
                <p className="mt-1 opacity-70">Whether a collapsible element is expanded</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-selected</code>
                <p className="mt-1 opacity-70">Whether an option is selected</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-disabled</code>
                <p className="mt-1 opacity-70">Whether an element is disabled</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-hidden</code>
                <p className="mt-1 opacity-70">Hide decorative elements from screen readers</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Relationship Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-labelledby</code>
                <p className="mt-1 opacity-70">References element(s) that label the current element</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-describedby</code>
                <p className="mt-1 opacity-70">References element(s) that describe the current element</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-controls</code>
                <p className="mt-1 opacity-70">References element(s) controlled by the current element</p>
              </div>
              <div>
                <code className="bg-base-200 px-2 py-1 rounded">aria-owns</code>
                <p className="mt-1 opacity-70">References child elements when DOM hierarchy isn't sufficient</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const ScreenReaderTesting: Story = {
  render: () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">Screen Reader Testing Guide</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Testing Tools</h4>
            <div className="space-y-3 text-sm">
              <div>
                • <strong>macOS:</strong> VoiceOver (built-in) - <kbd>Cmd + F5</kbd> to toggle
              </div>
              <div>
                • <strong>Windows:</strong> NVDA (free) or JAWS (commercial)
              </div>
              <div>
                • <strong>Browser:</strong> Chrome DevTools Accessibility panel
              </div>
              <div>
                • <strong>Automated:</strong> axe-core, jest-axe for unit tests
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Testing Checklist</h4>
            <div className="space-y-2 text-sm">
              <div>□ All interactive elements are focusable</div>
              <div>□ Focus indicators are visible</div>
              <div>□ Screen reader announces element purpose</div>
              <div>□ Form labels are properly associated</div>
              <div>□ Error messages are announced</div>
              <div>□ Dynamic content changes are announced</div>
              <div>□ Keyboard navigation works without mouse</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Common Issues</h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Missing Labels:</strong> Always provide accessible names for form controls
                <code className="block bg-base-200 p-2 mt-1 rounded text-xs">
                  &lt;input aria-label="Search" placeholder="Search..." /&gt;
                </code>
              </div>
              <div>
                <strong>Focus Trapping:</strong> Modal dialogs should trap focus within them
                <code className="block bg-base-200 p-2 mt-1 rounded text-xs">
                  // Focus first element when dialog opens, return focus when closed
                </code>
              </div>
              <div>
                <strong>Dynamic Content:</strong> Use aria-live regions for status updates
                <code className="block bg-base-200 p-2 mt-1 rounded text-xs">
                  &lt;div aria-live="polite" aria-atomic="true"&gt;Status message&lt;/div&gt;
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};
