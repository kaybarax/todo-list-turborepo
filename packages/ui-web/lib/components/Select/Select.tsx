import React from 'react';
import { cn, cv, type VariantProps } from '@todo/utils/ui/web';

const selectVariants = cv('select select-bordered w-full', {
  variants: {
    size: {
      xs: 'select-xs',
      sm: 'select-sm',
      md: 'select-md',
      lg: 'select-lg',
      xl: 'select-lg text-lg',
    },
    state: {
      default: '',
      primary: 'select-primary',
      secondary: 'select-secondary',
      accent: 'select-accent',
      info: 'select-info',
      success: 'select-success',
      warning: 'select-warning',
      error: 'select-error',
    },
    variant: {
      bordered: 'select-bordered',
      ghost: 'select-ghost',
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
    variant: 'bordered',
  },
});

export type SelectSize = NonNullable<VariantProps<typeof selectVariants>['size']>;
export type SelectState = NonNullable<VariantProps<typeof selectVariants>['state']>;

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'color' | 'size'>,
    Partial<Pick<VariantProps<typeof selectVariants>, 'size' | 'state' | 'variant'>> {
  helperText?: string;
  error?: boolean; // legacy, maps to state="error"
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      helperText,
      error,
      children,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      size = 'md',
      state = 'default',
      variant = 'bordered',
      id,
      ...props
    },
    ref,
  ) => {
    const effectiveState: SelectState = error ? 'error' : (state ?? 'default');
    const helperId = helperText ? `${id ?? 'select'}-help` : undefined;

    // Ensure accessibility by providing a fallback aria-label if none is provided
    const accessibilityProps = {
      'aria-label': ariaLabel ?? (ariaLabelledby ? undefined : 'Select option'),
      'aria-labelledby': ariaLabelledby,
    } as const;

    const classes = selectVariants({ size, state: effectiveState, variant });

    return (
      <div className="w-full">
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <select
          ref={ref}
          id={id}
          className={cn(classes, className)}
          aria-invalid={effectiveState === 'error' ? 'true' : undefined}
          aria-disabled={props.disabled ? 'true' : undefined}
          aria-describedby={helperId}
          title={ariaLabel ?? (ariaLabelledby ? undefined : 'Select option')}
          {...accessibilityProps}
          {...props}
        >
          {children}
        </select>

        {helperText && (
          <div className="label">
            <span
              id={helperId}
              className={cn('label-text-alt', effectiveState === 'error' ? 'text-error text-red-600' : 'text-gray-600')}
            >
              {helperText}
            </span>
          </div>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';

// For backward compatibility, create simple wrapper components
const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <option value="" disabled>
    {placeholder}
  </option>
);
const SelectTrigger = Select;
const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const SelectLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => <optgroup label={children as string} />;
const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <option value={value}>{children}</option>
);
const SelectSeparator: React.FC = () => <hr />;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator };
