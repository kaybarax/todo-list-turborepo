import { User, type UserDocument, type IUser } from './user.model';
import { ConflictError, NotFoundError } from '../../plugins/errors';
import { type RegisterBody } from '../../schemas/auth';
import { Trace } from '../../telemetry/trace.decorator';

interface FindAllQuery {
  page?: number;
  limit?: number;
  search?: string;
}

interface FindAllReturn {
  users: UserDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserService {
  @Trace('UserService.create')
  async create(registerBody: RegisterBody): Promise<UserDocument> {
    const existing = await User.findOne({ email: registerBody.email });
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    try {
      const created = await User.create(registerBody);
      return created;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictError('User with this email or wallet address already exists');
      }
      throw err;
    }
  }

  @Trace('UserService.findById')
  async findById(id: string): Promise<UserDocument> {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  }

  @Trace('UserService.findByEmail')
  async findByEmail(email: string): Promise<UserDocument | null> {
    return User.findOne({ email });
  }

  @Trace('UserService.findByWalletAddress')
  async findByWalletAddress(walletAddress: string): Promise<UserDocument | null> {
    return User.findOne({ walletAddress });
  }

  @Trace('UserService.updateById')
  async updateById(id: string, updateData: Partial<IUser>): Promise<UserDocument> {
    try {
      const updated = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updated) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      return updated;
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern) {
        if (err.keyPattern.email) {
          throw new ConflictError('User with this email already exists');
        }
        if (err.keyPattern.walletAddress) {
          throw new ConflictError('User with this wallet address already exists');
        }
        throw new ConflictError('Duplicate key error');
      }
      throw err;
    }
  }

  @Trace('UserService.updateLastLogin')
  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  @Trace('UserService.deactivateUser')
  async deactivateUser(id: string): Promise<UserDocument> {
    return this.updateById(id, { isActive: false } as Partial<IUser>);
  }

  @Trace('UserService.activateUser')
  async activateUser(id: string): Promise<UserDocument> {
    return this.updateById(id, { isActive: true } as Partial<IUser>);
  }

  @Trace('UserService.verifyUser')
  async verifyUser(id: string): Promise<UserDocument> {
    return this.updateById(id, { isVerified: true } as Partial<IUser>);
  }

  @Trace('UserService.deleteById')
  async deleteById(id: string): Promise<UserDocument> {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return deleted;
  }

  @Trace('UserService.findAll')
  async findAll(query: FindAllQuery = {}): Promise<UserDocument[] | FindAllReturn> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search;

    const filter = search
      ? {
          $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
        }
      : {};

    if (search) {
      const users = await User.find(filter)
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
      return users;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      users,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  @Trace('UserService.getUserStats')
  async getUserStats(): Promise<{
    totalTodos: number;
    completedTodos: number;
    activeTodos: number;
    overdueTodos: number;
  }> {
    // Parity with NestJS stub: returns zeros
    return {
      totalTodos: 0,
      completedTodos: 0,
      activeTodos: 0,
      overdueTodos: 0,
    };
  }
}

export const userService = new UserService();
