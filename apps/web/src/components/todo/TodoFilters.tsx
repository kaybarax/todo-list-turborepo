'use client';

import React from 'react';
import { Button, ButtonGroup, Input } from '@todo/ui-web';

export type PriorityFilter = 'all' | 'low' | 'medium' | 'high';
export type StatusFilter = 'all' | 'open' | 'completed';

export interface TodoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  priority: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  onClear?: () => void;
}

const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high'] as const;
const STATUS_OPTIONS = ['all', 'open', 'completed'] as const;

export const TodoFilters: React.FC<TodoFiltersProps> = ({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
  onClear,
}) => {
  const hasActiveFilters = search.trim().length > 0 || priority !== 'all' || status !== 'all';

  return (
    <div className="space-y-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="todo-filter-search" className="text-sm font-medium text-base-content">
          Search
        </label>
        <Input
          id="todo-filter-search"
          type="search"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Search title, description, or #tag"
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content">Priority</div>
        <ButtonGroup value={priority} onValueChange={p => onPriorityChange(p as PriorityFilter)}>
          {PRIORITY_OPTIONS.map(option => (
            <Button key={option} value={option} size="sm">
              {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content">Status</div>
        <ButtonGroup value={status} onValueChange={s => onStatusChange(s as StatusFilter)}>
          {STATUS_OPTIONS.map(option => (
            <Button key={option} value={option} size="sm">
              {option === 'all' ? 'Any' : option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!hasActiveFilters}
          onClick={() => {
            onSearchChange('');
            onPriorityChange('all');
            onStatusChange('all');
            onClear?.();
          }}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
};

export default TodoFilters;
