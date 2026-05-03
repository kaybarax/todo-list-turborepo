// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Button } from '../../lib/components/Button/Button';
import { Input } from '../../lib/components/Input/Input';
import { Card } from '../../lib/components/Card/Card';

const meta: Meta = {
  title: 'Foundation/Component Guide',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive guide for using design system components with best practices and examples.',
      },
    },
  },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

export const UsagePatterns: Story = {
  render: () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">Import Patterns</h3>
        <div className="bg-base-200 p-4 rounded-lg font-mono text-sm">
          <div>// Named imports (recommended)</div>
          <div>import &#123; Button, Input, Card &#125; from '@todo/ui-web';</div>
          <br />
          <div>// Individual imports for tree-shaking</div>
          <div>import &#123; Button &#125; from '@todo/ui-web/components/Button';</div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Common Patterns</h3>
        <div className="grid gap-6">
          <div>
            <h4 className="font-medium mb-2">Form Layout</h4>
            <Card className="p-4">
              <div className="space-y-4">
                <Input placeholder="Email" type="email" />
                <Input placeholder="Password" type="password" />
                <Button className="w-full">Sign In</Button>
              </div>
            </Card>
          </div>

          <div>
            <h4 className="font-medium mb-2">Action Groups</h4>
            <div className="flex gap-2">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Accessibility Guidelines</h3>
        <div className="space-y-3 text-sm">
          <div>• Always provide meaningful labels and descriptions</div>
          <div>• Use semantic HTML elements when possible</div>
          <div>• Ensure keyboard navigation works properly</div>
          <div>• Test with screen readers</div>
          <div>• Maintain sufficient color contrast ratios</div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Performance Best Practices</h3>
        <div className="space-y-3 text-sm">
          <div>• Import only components you need</div>
          <div>• Use React.memo for expensive components</div>
          <div>• Avoid inline styles and functions in render</div>
          <div>• Leverage component variants instead of custom styling</div>
        </div>
      </section>
    </div>
  ),
};

export const PropPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold mb-4">Common Prop Patterns</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Variants</h4>
            <p className="text-sm opacity-70 mb-2">Use variant props for predefined styles:</p>
            <div className="flex gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Sizes</h4>
            <p className="text-sm opacity-70 mb-2">Consistent sizing across components:</p>
            <div className="flex items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">States</h4>
            <p className="text-sm opacity-70 mb-2">Handle loading and disabled states:</p>
            <div className="flex gap-2">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};
