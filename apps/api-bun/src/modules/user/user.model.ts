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

  // If it already looks like a bcrypt hash (e.g. from tests or migration), don't hash again
  if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$') || this.password.startsWith('$2y$')) {
    return next();
  }

  try {
    this.password = await Bun.password.hash(this.password, {
      algorithm: 'bcrypt',
      cost: 10,
    });
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return Bun.password.verify(candidatePassword, this.password);
};

// Add indexes
userSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser, Model<IUser, any, IUserMethods>>('User', userSchema);
