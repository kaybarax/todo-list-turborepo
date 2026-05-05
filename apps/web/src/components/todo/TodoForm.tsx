'use client';

import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, Button, Input, Textarea, Label, Badge } from '@todo/ui-web';

const todoFormVariants = cva('form-control w-full', {
  variants: {
    variant: {
      default: 'space-y-4',
      compact: 'space-y-2',
      inline: 'flex flex-row space-x-2 space-y-0 items-end',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const fieldVariants = cva('', {
  variants: {
    variant: {
      default: '',
      compact: '',
      inline: 'flex-1',
    },
  },
});

export interface TodoFormData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
}

export interface TodoFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>,
    VariantProps<typeof todoFormVariants> {
  onSubmit: (todoData: TodoFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<TodoFormData>;
  disabled?: boolean;
  loading?: boolean;
  'data-testid'?: string;
}

const TodoForm = React.forwardRef<HTMLFormElement, TodoFormProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      onSubmit,
      onCancel,
      initialData,
      disabled = false,
      loading = false,
      'data-testid': testId,
      ...props
    },
    ref,
  ) => {
    const [title, setTitle] = useState(initialData?.title ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialData?.priority ?? 'medium');
    const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};

      if (!title.trim()) {
        newErrors.title = 'Title is required';
      }

      if (title.trim().length > 100) {
        newErrors.title = 'Title must be less than 100 characters';
      }

      if (description && description.length > 500) {
        newErrors.description = 'Description must be less than 500 characters';
      }

      if (tags.length > 10) {
        newErrors.tags = 'Maximum 10 tags allowed';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (disabled || loading) return;

      if (!validateForm()) return;

      const formData: TodoFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags,
      };

      onSubmit(formData);

      // Reset form if not editing (no initial data)
      if (!initialData) {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setTags([]);
        setTagInput('');
        setErrors({});
      }
    };

    const addTag = () => {
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag)) {
        if (tags.length >= 10) {
          setErrors(prev => ({ ...prev, tags: 'Maximum 10 tags allowed' }));
          return;
        }
        setTags([...tags, tag]);
        setTagInput('');
        // Clear tags error if it exists
        if (errors.tags) {
          setErrors(prev => ({ ...prev, tags: '' }));
        }
      }
    };

    const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleTagKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    };

    const isInline = variant === 'inline';
    const isCompact = variant === 'compact';

    if (isInline) {
      return (
        <form
          ref={ref}
          className={cn(todoFormVariants({ variant, size }), className)}
          onSubmit={handleSubmit}
          data-testid={testId}
          role="form"
          {...props}
        >
          <div className={cn(fieldVariants({ variant }))}>
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="Enter todo title"
              variant="bordered"
              disabled={disabled || loading}
              required
              className={errors.title ? 'border-error' : ''}
            />
          </div>
          <div className="flex space-x-2">
            <Button type="submit" variant="default" disabled={disabled || loading || !title.trim()} loading={loading}>
              {initialData ? 'Update' : 'Add'}
            </Button>
            {onCancel && (
              <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      );
    }

    return (
      <form
        ref={ref}
        className={cn(todoFormVariants({ variant, size }), className)}
        onSubmit={handleSubmit}
        data-testid={testId}
        role="form"
        {...props}
      >
        <div>
          <Label htmlFor="title" className="block text-base-content mb-1">
            Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            placeholder="Enter todo title"
            variant="bordered"
            disabled={disabled || loading}
            required
            className={errors.title ? 'border-error' : ''}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <div id="title-error" className="text-error text-sm mt-1" role="alert">
              {errors.title}
            </div>
          )}
        </div>

        {!isCompact && (
          <div>
            <Label htmlFor="description" className="block text-base-content mb-1">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              rows={3}
              placeholder="Enter description (optional)"
              variant="bordered"
              disabled={disabled || loading}
              className={errors.description ? 'border-error' : ''}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <div id="description-error" className="text-error text-sm mt-1" role="alert">
                {errors.description}
              </div>
            )}
          </div>
        )}

        <div className={isCompact ? 'flex space-x-2' : 'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
          <div>
            <Label htmlFor="priority" className="block text-base-content mb-1">
              Priority
            </Label>
            <select
              id="priority"
              value={priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPriority(e.target.value as 'low' | 'medium' | 'high')
              }
              className="select select-bordered w-full"
              disabled={disabled || loading}
              aria-label="Select priority level"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {!isCompact && (
            <div>
              <Label htmlFor="dueDate" className="block text-base-content mb-1">
                Due Date
              </Label>
              <Input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
                variant="bordered"
                disabled={disabled || loading}
              />
            </div>
          )}
        </div>

        {!isCompact && (
          <div>
            <Label htmlFor="tags" className="block text-base-content mb-1">
              Tags
            </Label>
            <div className="flex rounded-md shadow-sm">
              <Input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add a tag"
                variant="bordered"
                className="flex-1 rounded-r-none"
                disabled={disabled || loading || tags.length >= 10}
                aria-describedby={errors.tags ? 'tags-error' : undefined}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="rounded-l-none border-l-0"
                disabled={disabled || loading || !tagInput.trim() || tags.length >= 10}
              >
                Add
              </Button>
            </div>
            {errors.tags && (
              <div id="tags-error" className="text-error text-sm mt-1" role="alert">
                {errors.tags}
              </div>
            )}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="inline-flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                      disabled={disabled || loading}
                      aria-label={`Remove ${tag} tag`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="default" disabled={disabled || loading || !title.trim()} loading={loading}>
            {initialData ? 'Update Todo' : 'Create Todo'}
          </Button>
        </div>
      </form>
    );
  },
);

TodoForm.displayName = 'TodoForm';

export { TodoForm, todoFormVariants };
