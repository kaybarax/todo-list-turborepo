import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './schemas/todo.schema';
import { TodoService } from './todo.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Todos')
@Controller('todos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'Todo created successfully', type: Todo })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createTodoDto: CreateTodoDto, @CurrentUser() user: { id: string }): Promise<Todo> {
    return this.todoService.create(createTodoDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Todos retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'completed', required: false, description: 'Filter by completion status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title and description' })
  async findAll(@Query() queryDto: QueryTodoDto, @CurrentUser() user: { id: string }) {
    return this.todoService.findAll(queryDto, user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get todo statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@CurrentUser() user: { id: string }) {
    return this.todoService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a todo by ID' })
  @ApiResponse({ status: 200, description: 'Todo retrieved successfully', type: Todo })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @CurrentUser() user: { id: string }): Promise<Todo> {
    return this.todoService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiResponse({ status: 200, description: 'Todo updated successfully', type: Todo })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: { id: string },
  ): Promise<Todo> {
    return this.todoService.update(id, updateTodoDto, user.id);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle todo completion status' })
  @ApiResponse({ status: 200, description: 'Todo toggled successfully', type: Todo })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async toggleComplete(@Param('id') id: string, @CurrentUser() user: { id: string }): Promise<Todo> {
    return this.todoService.toggleComplete(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiResponse({ status: 204, description: 'Todo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }): Promise<void> {
    return this.todoService.remove(id, user.id);
  }
}
