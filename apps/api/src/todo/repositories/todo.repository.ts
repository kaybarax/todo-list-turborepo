import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, PipelineStage } from 'mongoose';

import { Todo, TodoDocument } from '../schemas/todo.schema';

@Injectable()
export class TodoRepository {
  constructor(@InjectModel(Todo.name) private todoModel: Model<TodoDocument>) {}

  async create(todoData: Partial<Todo>): Promise<Todo> {
    const todo = new this.todoModel(todoData);
    return todo.save();
  }

  async findById(id: string): Promise<Todo | null> {
    return this.todoModel.findById(id).exec();
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Todo | null> {
    return this.todoModel.findOne({ _id: id, userId }).exec();
  }

  async findMany(
    filter: FilterQuery<TodoDocument>,
    options: {
      sort?: Record<string, 1 | -1>;
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<Todo[]> {
    let query = this.todoModel.find(filter);

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return query.exec();
  }

  async count(filter: FilterQuery<TodoDocument>): Promise<number> {
    return this.todoModel.countDocuments(filter).exec();
  }

  async updateById(id: string, updateData: Partial<Todo>): Promise<Todo | null> {
    return this.todoModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.todoModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async aggregate(pipeline: PipelineStage[]): Promise<any[]> {
    return this.todoModel.aggregate(pipeline).exec();
  }

  async findOverdueTodos(userId: string): Promise<Todo[]> {
    return this.todoModel
      .find({
        userId,
        completed: false,
        dueDate: { $lt: new Date() },
      })
      .sort({ dueDate: 1 })
      .exec();
  }

  async findTodosByTag(userId: string, tag: string): Promise<Todo[]> {
    return this.todoModel
      .find({
        userId,
        tags: { $in: [tag] },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findTodosByPriority(userId: string, priority: 'low' | 'medium' | 'high'): Promise<Todo[]> {
    return this.todoModel
      .find({
        userId,
        priority,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findBlockchainTodos(userId: string, network?: 'solana' | 'polkadot' | 'polygon'): Promise<Todo[]> {
    const filter: FilterQuery<TodoDocument> = {
      userId,
      blockchainNetwork: { $exists: true },
    };

    if (network) {
      filter.blockchainNetwork = network;
    }

    return this.todoModel.find(filter).sort({ createdAt: -1 }).exec();
  }
}
