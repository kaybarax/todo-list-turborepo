import mongoose, { Schema, Document, Model } from 'mongoose';
import { defaultSchemaOptions } from '../../db/utils';

export interface ITodo {
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags: string[];
  userId: string;
  blockchainNetwork?: 'solana' | 'polkadot' | 'polygon';
  transactionHash?: string;
  blockchainAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TodoDocument = ITodo & Document;

const todoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date },
    tags: { type: [String], default: [] },
    userId: { type: String, required: true },
    blockchainNetwork: { type: String, enum: ['solana', 'polkadot', 'polygon'] },
    transactionHash: { type: String },
    blockchainAddress: { type: String },
  },
  defaultSchemaOptions,
);

// Add indexes for better query performance
todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, completed: 1 });
todoSchema.index({ userId: 1, priority: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ userId: 1, tags: 1 });

export const Todo = mongoose.model<ITodo>('Todo', todoSchema);
