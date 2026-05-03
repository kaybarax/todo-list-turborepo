import { Types } from 'mongoose';

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

/**
 * Helper to ensure consistent model serialization
 * Converts _id to id and removes __v and password if present
 */
export const transformModel = (_doc: any, ret: any) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  delete ret.password;
  return ret;
};

/**
 * Default schema options for consistent serialization
 */
export const defaultSchemaOptions = {
  timestamps: true,
  toJSON: {
    transform: transformModel,
    virtuals: true,
  },
  toObject: {
    transform: transformModel,
    virtuals: true,
  },
};
