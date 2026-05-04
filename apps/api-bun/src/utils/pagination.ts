/**
 * Reusable pagination helper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Format pagination response to match NestJS parity (sometimes they use 'items' or 'todos')
 * This helper uses the standard format which we'll adapt in controllers if needed.
 */
export function paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

/**
 * Calculate skip for Mongoose query
 */
export function getSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * Math.max(1, limit);
}
