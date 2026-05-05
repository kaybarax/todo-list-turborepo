import { ApiError } from './ApiError';
import { BaseApiClient } from './BaseApiClient';
import {
  type ApiClientConfig,
  type ApiResponse,
  type ApiTodo,
  type CreateApiTodoInput,
  type UpdateApiTodoInput,
  apiTodoSchema,
  createApiTodoSchema,
  updateApiTodoSchema,
} from './types';

/**
 * Todo API client for managing todos
 */
export class TodoApiClient extends BaseApiClient {
  /**
   * Create a new TodoApiClient
   * @param config - API client configuration
   */
  constructor(config: ApiClientConfig) {
    super(config);
  }

  /**
   * Get all todos for the authenticated user
   * @param params - Query parameters
   */
  async getTodos(params?: {
    page?: number;
    limit?: number;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    search?: string;
    tags?: string[];
  }): Promise<ApiResponse<ApiTodo[]>> {
    try {
      const response = await this.get<ApiTodo[]>('/todos', { params });

      // Validate response data
      if (response.success && response.data) {
        const validatedData = response.data.map(todo => {
          const result = apiTodoSchema.safeParse(todo);
          if (!result.success) {
            throw ApiError.validationError(`Invalid todo data: ${result.error.message}`);
          }
          return result.data;
        });

        return {
          ...response,
          data: validatedData,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to fetch todos', error);
    }
  }

  /**
   * Get a specific todo by ID
   * @param id - Todo ID
   */
  async getTodoById(id: string): Promise<ApiResponse<ApiTodo>> {
    try {
      const response = await this.get<ApiTodo>(`/todos/${id}`);

      // Validate response data
      if (response.success && response.data) {
        const result = apiTodoSchema.safeParse(response.data);
        if (!result.success) {
          throw ApiError.validationError(`Invalid todo data: ${result.error.message}`);
        }

        return {
          ...response,
          data: result.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError(`Failed to fetch todo with ID ${id}`, error);
    }
  }

  /**
   * Create a new todo
   * @param todo - Todo data to create
   */
  async createTodo(todo: CreateApiTodoInput): Promise<ApiResponse<ApiTodo>> {
    try {
      // Validate input data
      const result = createApiTodoSchema.safeParse(todo);
      if (!result.success) {
        throw ApiError.validationError(`Invalid todo data: ${result.error.message}`);
      }

      const response = await this.post<ApiTodo>('/todos', result.data);

      // Validate response data
      if (response.success && response.data) {
        const todoResult = apiTodoSchema.safeParse(response.data);
        if (!todoResult.success) {
          throw ApiError.validationError(`Invalid todo response: ${todoResult.error.message}`);
        }

        return {
          ...response,
          data: todoResult.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to create todo', error);
    }
  }

  /**
   * Update an existing todo
   * @param id - Todo ID
   * @param todo - Updated todo data
   */
  async updateTodo(id: string, todo: UpdateApiTodoInput): Promise<ApiResponse<ApiTodo>> {
    try {
      // Validate input data
      const result = updateApiTodoSchema.safeParse(todo);
      if (!result.success) {
        throw ApiError.validationError(`Invalid todo data: ${result.error.message}`);
      }

      const response = await this.patch<ApiTodo>(`/todos/${id}`, result.data);

      // Validate response data
      if (response.success && response.data) {
        const todoResult = apiTodoSchema.safeParse(response.data);
        if (!todoResult.success) {
          throw ApiError.validationError(`Invalid todo response: ${todoResult.error.message}`);
        }

        return {
          ...response,
          data: todoResult.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError(`Failed to update todo with ID ${id}`, error);
    }
  }

  /**
   * Delete a todo
   * @param id - Todo ID
   */
  async deleteTodo(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.delete<void>(`/todos/${id}`);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError(`Failed to delete todo with ID ${id}`, error);
    }
  }

  /**
   * Toggle todo completion status
   * @param id - Todo ID
   */
  async toggleTodo(id: string): Promise<ApiResponse<ApiTodo>> {
    try {
      const response = await this.patch<ApiTodo>(`/todos/${id}/toggle`);

      // Validate response data
      if (response.success && response.data) {
        const result = apiTodoSchema.safeParse(response.data);
        if (!result.success) {
          throw ApiError.validationError(`Invalid todo response: ${result.error.message}`);
        }

        return {
          ...response,
          data: result.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError(`Failed to toggle todo with ID ${id}`, error);
    }
  }

  /**
   * Bulk update todos
   * @param updates - Array of todo updates
   */
  async bulkUpdateTodos(updates: Array<{ id: string; data: UpdateApiTodoInput }>): Promise<ApiResponse<ApiTodo[]>> {
    try {
      // Validate input data
      const validatedUpdates = updates.map(update => {
        const result = updateApiTodoSchema.safeParse(update.data);
        if (!result.success) {
          throw ApiError.validationError(`Invalid todo data for ID ${update.id}: ${result.error.message}`);
        }
        return {
          id: update.id,
          data: result.data,
        };
      });

      const response = await this.patch<ApiTodo[]>('/todos/bulk', { updates: validatedUpdates });

      // Validate response data
      if (response.success && response.data) {
        const validatedData = response.data.map(todo => {
          const result = apiTodoSchema.safeParse(todo);
          if (!result.success) {
            throw ApiError.validationError(`Invalid todo data: ${result.error.message}`);
          }
          return result.data;
        });

        return {
          ...response,
          data: validatedData,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to bulk update todos', error);
    }
  }

  /**
   * Search todos
   * @param query - Search query
   * @param filters - Additional filters
   */
  async searchTodos(
    query: string,
    filters?: {
      completed?: boolean;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<ApiResponse<ApiTodo[]>> {
    try {
      const params = {
        q: query,
        ...filters,
      };

      const response = await this.get<ApiTodo[]>('/todos/search', { params });

      // Validate response data
      if (response.success && response.data) {
        const validatedData = response.data.map(todo => {
          const result = apiTodoSchema.safeParse(todo);
          if (!result.success) {
            throw ApiError.validationError(`Invalid todo data: ${result.error.message}`);
          }
          return result.data;
        });

        return {
          ...response,
          data: validatedData,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to search todos', error);
    }
  }
}
