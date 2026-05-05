import React from 'react';

import { cn, cv, type VariantProps } from '@todo/utils/ui/web';
import { Text } from '../Text/Text';

const cardVariants = cv('card bg-base-100 transition-shadow', {
  variants: {
    elevation: {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
    },
    variant: {
      default: '',
      bordered: 'card-bordered',
      compact: 'card-compact',
      normal: 'card-normal',
      side: 'card-side',
    },
    interactive: {
      false: '',
      true: 'hover:shadow-xl focus:shadow-xl cursor-pointer outline-none',
    },
    glass: {
      true: 'glass',
    },
  },
  defaultVariants: {
    elevation: 'xl',
    variant: 'default',
    interactive: false,
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof cardVariants>, 'interactive'> {
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, variant, interactive = false, glass, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ elevation, variant, interactive, glass }), className)}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card-body pb-4 flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <Text as="h3" variant="h3" ref={ref} className={cn('card-title', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <Text variant="muted" ref={ref} className={className} {...props} />,
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('card-body p-6 pt-0', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card-actions justify-end flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
