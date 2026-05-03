import * as bcrypt from 'bcryptjs';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

import { defaultSchemaOptions } from '../../db/utils';

export interface IUser {
  email: string;
  password: string;
  name: string;
  walletAddress?: string;
  preferredNetwork?: 'solana' | 'polkadot' | 'polygon';
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    defaultPriority: 'low' | 'medium' | 'high';
  };
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

export type UserDocument = IUser & IUserMethods & Document;

const userSchema = new Schema<IUser, Model<IUser, any, IUserMethods>, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    walletAddress: { type: String, sparse: true },
    preferredNetwork: { type: String, enum: ['solana', 'polkadot', 'polygon'] },
    settings: {
      type: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        notifications: { type: Boolean, default: true },
        defaultPriority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      },
      default: {},
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  defaultSchemaOptions,
);

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add indexes
userSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser, Model<IUser, any, IUserMethods>>('User', userSchema);
