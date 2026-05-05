import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@todo/utils/ui/web';

const buttonVariants = cva('btn bg-primary h-10', {
  variants: {
    variant: {
      default: 'btn-primary',
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      neutral: 'btn-neutral',
      info: 'btn-info',
      success: 'btn-success',
      warning: 'btn-warning',
      error: 'btn-error',
      ghost: 'btn-ghost',
      link: 'btn-link',
      outline: 'btn-outline',
      active: 'btn-active',
      disabled: 'btn-disabled',
      destructive: 'btn-error',
    },
    size: {
      xs: 'btn-xs',
      sm: 'btn-sm',
      default: 'btn-md',
      md: 'btn-md',
      lg: 'btn-lg',
    },
    shape: {
      default: '',
      square: 'btn-square',
      circle: 'btn-circle',
      wide: 'btn-wide',
    },
    glass: {
      true: 'glass',
    },
    block: {
      true: 'btn-block',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    shape: 'default',
  },
});

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'size'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  /** Custom loading spinner size */
  loadingSize?: 'xs' | 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      shape = 'default',
      glass,
      block,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      loading = false,
      loadingText,
      loadingSize = 'sm',
      disabled,
      ...props
    },
    ref,
  ) => {
    // Handle asChild by rendering a div wrapper if needed
    if (asChild) {
      return <div className={cn(buttonVariants({ variant, size, shape, glass, block }), className)}>{children}</div>;
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          buttonVariants({ variant, size, shape, glass, block }),
          className,
        )}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        aria-disabled={loading || disabled || undefined}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="mr-2 inline-flex items-center" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="ml-2 inline-flex items-center" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
