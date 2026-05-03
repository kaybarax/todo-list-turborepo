import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @ApiProperty({ description: 'User wallet address', example: '0x1234567890abcdef', required: false })
  @Prop({ sparse: true })
  walletAddress?: string;

  @ApiProperty({
    description: 'Preferred blockchain network',
    enum: ['solana', 'polkadot', 'polygon'],
    required: false,
  })
  @Prop({ enum: ['solana', 'polkadot', 'polygon'] })
  preferredNetwork?: 'solana' | 'polkadot' | 'polygon';

  @ApiProperty({ description: 'User settings' })
  @Prop({
    type: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      notifications: { type: Boolean, default: true },
      defaultPriority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    },
    default: {},
  })
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    defaultPriority: 'low' | 'medium' | 'high';
  };

  @ApiProperty({ description: 'Account verification status' })
  @Prop({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Account active status' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Prop({ type: Date })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  // Virtual method to compare passwords

  comparePassword: (password: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save middleware to hash password
UserSchema.pre<UserDocument>('save', async function (next) {
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
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Add indexes
UserSchema.index({ email: 1 });
UserSchema.index({ walletAddress: 1 }, { sparse: true });
UserSchema.index({ createdAt: -1 });
