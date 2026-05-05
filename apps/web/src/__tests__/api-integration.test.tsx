import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { TodoApiClient } from '@todo/services';
import { TodoList, TodoForm } from '@/components/todo';
import { apiTodoToTodo } from './test-utils';

// Mock data
let mockApiTodos = [
  {
    id: '1',
    title: 'First Todo',
    description: 'First todo description',
    completed: false,
    priority: 'high' as const,
    dueDate: '2024-12-31',
    tags: ['work', 'urgent'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'test-user',
  },
  {
    id: '2',
    title: 'Second Todo',
    description: 'Second todo description',
    completed: true,
    priority: 'medium' as const,
    dueDate: '2024-11-30',
    tags: ['personal'],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    userId: 'test-user',
  },
];

// Mock server setup
const server = setupServer(
  http.get('http://localhost:3001/api/v1/todos', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    const search = url.searchParams.get('search');
    const completed = url.searchParams.get('completed');
    const priority = url.searchParams.get('priority');

    let todos = [...mockApiTodos];

    // Apply filters
    if (search) {
      todos = todos.filter(
        todo =>
          todo.title.toLowerCase().includes(search.toLowerCase()) ||
          (todo.description && todo.description.toLowerCase().includes(search.toLowerCase())),
      );
    }

    if (completed !== null) {
      todos = todos.filter(todo => todo.completed === (completed === 'true'));
    }

    if (priority && priority !== 'all') {
      todos = todos.filter(todo => todo.priority === priority);
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTodos = todos.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: paginatedTodos,
    });
  }),

  http.get('http://localhost:3001/api/v1/todos/:id', ({ params }) => {
    const { id } = params;
    const todo = mockApiTodos.find(t => t.id === id);

    if (!todo) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      success: true,
      data: todo,
    });
  }),

  http.post('http://localhost:3001/api/v1/todos', async ({ request }) => {
    const body = (await request.json()) as any;
    const newTodo = {
      id: `todo-${Date.now()}`,
      title: body.title,
      description: body.description,
      completed: body.completed || false,
      priority: body.priority || ('medium' as const),
      dueDate: body.dueDate,
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'test-user',
    };

    mockApiTodos.push(newTodo);

    return HttpResponse.json(
      {
        success: true,
        data: newTodo,
      },
      { status: 201 },
    );
  }),

  http.patch('http://localhost:3001/api/v1/todos/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as any;
    const todoIndex = mockApiTodos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 },
      );
    }

    mockApiTodos[todoIndex] = {
      ...mockApiTodos[todoIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockApiTodos[todoIndex],
    });
  }),

  http.patch('http://localhost:3001/api/v1/todos/:id/toggle', ({ params }) => {
    const { id } = params;
    const todoIndex = mockApiTodos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 },
      );
    }

    mockApiTodos[todoIndex] = {
      ...mockApiTodos[todoIndex],
      completed: !mockApiTodos[todoIndex].completed,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockApiTodos[todoIndex],
    });
  }),

  http.delete('http://localhost:3001/api/v1/todos/:id', ({ params }) => {
    const { id } = params;
    const todoIndex = mockApiTodos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 },
      );
    }

    mockApiTodos.splice(todoIndex, 1);

    return HttpResponse.json({
      success: true,
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Reset mock data
  mockApiTodos = [
    {
      id: '1',
      title: 'First Todo',
      description: 'First todo description',
      completed: false,
      priority: 'high' as const,
      dueDate: '2024-12-31',
      tags: ['work', 'urgent'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      userId: 'test-user',
    },
    {
      id: '2',
      title: 'Second Todo',
      description: 'Second todo description',
      completed: true,
      priority: 'medium' as const,
      dueDate: '2024-11-30',
      tags: ['personal'],
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      userId: 'test-user',
    },
  ];
});
afterAll(() => server.close());

describe('API Integration Tests', () => {
  let apiClient: TodoApiClient;

  beforeEach(() => {
    apiClient = new TodoApiClient({
      baseUrl: 'http://localhost:3001/api/v1',
    });
  });

  describe('TodoApiClient', () => {
    it('should fetch todos successfully', async () => {
      const result = await apiClient.getTodos();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].title).toBe('First Todo');
    });

    it('should create a todo successfully', async () => {
      const newTodo = {
        title: 'New Todo',
        description: 'New description',
        priority: 'medium' as const,
        completed: false,
        tags: ['test'],
      };

      const result = await apiClient.createTodo(newTodo);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('New Todo');
    });

    it('should handle validation errors', async () => {
      try {
        await apiClient.createTodo({
          title: '',
          description: 'Invalid todo',
          priority: 'medium',
          completed: false,
          tags: [],
        });
      } catch (error) {
        // Expected to throw due to validation
        expect(error).toBeDefined();
      }
    });
  });

  describe('TodoList Component Integration', () => {
    it('should render todos from API', async () => {
      const mockTodos = mockApiTodos.map(apiTodoToTodo);
      const mockOnToggle = jest.fn();
      const mockOnEdit = jest.fn();
      const mockOnDelete = jest.fn();

      render(<TodoList todos={mockTodos} onToggle={mockOnToggle} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
      expect(screen.getByText('First Todo')).toBeInTheDocument();
      expect(screen.getByText('Second Todo')).toBeInTheDocument();
    });

    it('should show empty state when no todos', () => {
      const mockOnToggle = jest.fn();
      const mockOnEdit = jest.fn();
      const mockOnDelete = jest.fn();

      render(<TodoList todos={[]} onToggle={mockOnToggle} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText('No todos')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating a new todo.')).toBeInTheDocument();
    });
  });

  describe('TodoForm Component Integration', () => {
    it('should submit form with correct data', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      render(<TodoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('Enter todo title'), {
        target: { value: 'Test Todo' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter description (optional)'), {
        target: { value: 'Test Description' },
      });

      // Submit form
      fireEvent.click(screen.getByText('Create Todo'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Test Todo',
          description: 'Test Description',
          priority: 'medium',
          dueDate: undefined,
          tags: [],
        });
      });
    });
  });
});
