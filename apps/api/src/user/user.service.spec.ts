// Test file: allowing 'any' type for Mongoose mocking and test assertions
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userModel: jest.Mocked<Model<User>>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    walletAddress: '0x123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    save: jest.fn(),
    toObject: jest.fn(),
  };

  beforeEach(async () => {
    const mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'hashedPassword',
        name: 'New User',
      };

      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(mockUser as any);

      const result = await service.create(createUserDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(userModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        password: 'hashedPassword',
        name: 'Existing User',
      };

      userModel.findOne.mockResolvedValue(mockUser as any);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(userModel.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('should create user with wallet address', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'hashedPassword',
        name: 'New User',
        walletAddress: '0x456',
      };

      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue({ ...mockUser, walletAddress: '0x456' } as any);

      const result = await service.create(createUserDto);

      expect(userModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result.walletAddress).toBe('0x456');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      const email = 'test@example.com';

      userModel.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail(email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      userModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });

  describe('findByWalletAddress', () => {
    it('should find user by wallet address successfully', async () => {
      const walletAddress = '0x123';

      userModel.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findByWalletAddress(walletAddress);

      expect(userModel.findOne).toHaveBeenCalledWith({ walletAddress });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by wallet address', async () => {
      const walletAddress = '0x456';

      userModel.findOne.mockResolvedValue(null);

      const result = await service.findByWalletAddress(walletAddress);

      expect(userModel.findOne).toHaveBeenCalledWith({ walletAddress });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';

      userModel.findById.mockResolvedValue(mockUser as any);

      const result = await service.findById(userId);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found by ID', async () => {
      const userId = '507f1f77bcf86cd799439012';

      userModel.findById.mockResolvedValue(null);

      await expect(service.findById(userId)).rejects.toThrow(new NotFoundException(`User with ID ${userId} not found`));

      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateById', () => {
    it('should update user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Name',
        walletAddress: '0x789',
      };

      const updatedUser = { ...mockUser, ...updateData };
      userModel.findByIdAndUpdate.mockResolvedValue(updatedUser as any);

      const result = await service.updateById(userId, updateData);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, { new: true, runValidators: true });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found during update', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const updateData = { name: 'Updated Name' };

      userModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.updateById(userId, updateData)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, { new: true, runValidators: true });
    });

    it('should handle email uniqueness during update', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { email: 'existing@example.com' };

      userModel.findByIdAndUpdate.mockRejectedValue({
        code: 11000,
        keyPattern: { email: 1 },
      });

      await expect(service.updateById(userId, updateData)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
    });

    it('should handle wallet address uniqueness during update', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { walletAddress: '0x456' };

      userModel.findByIdAndUpdate.mockRejectedValue({
        code: 11000,
        keyPattern: { walletAddress: 1 },
      });

      await expect(service.updateById(userId, updateData)).rejects.toThrow(
        new ConflictException('User with this wallet address already exists'),
      );
    });
  });

  describe('deleteById', () => {
    it('should delete user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';

      userModel.findByIdAndDelete.mockResolvedValue(mockUser as any);

      const result = await service.deleteById(userId);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found during deletion', async () => {
      const userId = '507f1f77bcf86cd799439012';

      userModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.deleteById(userId)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });
  });

  describe('findAll', () => {
    it('should find all users with pagination', async () => {
      const users = [mockUser, { ...mockUser, _id: '507f1f77bcf86cd799439012' }];
      const query = { page: 1, limit: 10 };

      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(users),
            }),
          }),
        }),
      } as any);

      userModel.countDocuments.mockResolvedValue(2);

      const result = await service.findAll(query);

      expect(userModel.find).toHaveBeenCalledWith({});
      expect(userModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        users,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should find users with search filter', async () => {
      const users = [mockUser];
      const query = { page: 1, limit: 10, search: 'test' };

      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(users),
            }),
          }),
        }),
      } as any);

      userModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(userModel.find).toHaveBeenCalledWith({
        $or: [{ name: { $regex: 'test', $options: 'i' } }, { email: { $regex: 'test', $options: 'i' } }],
      });
      expect(result).toEqual(users);
    });

    it('should handle empty results', async () => {
      const query = { page: 1, limit: 10 };

      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      userModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll(query);

      expect(result).toEqual({
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics', async () => {
      // const userId = '507f1f77bcf86cd799439011';
      const mockStats = [
        {
          totalTodos: 10,
          completedTodos: 5,
          activeTodos: 5,
          overdueTodos: 2,
        },
      ];

      userModel.aggregate.mockResolvedValue(mockStats);

      const result = await service.getUserStats();

      expect(userModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockStats[0]);
    });

    it('should handle user with no todos', async () => {
      // const userId = '507f1f77bcf86cd799439011';

      userModel.aggregate.mockResolvedValue([]);

      const result = await service.getUserStats();

      expect(result).toEqual({
        totalTodos: 0,
        completedTodos: 0,
        activeTodos: 0,
        overdueTodos: 0,
      });
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      const email = 'test@example.com';

      userModel.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.findByEmail(email)).rejects.toThrow('Database connection failed');
    });

    it('should handle validation errors during creation', async () => {
      const createUserDto = {
        email: 'invalid-email',
        password: 'hashedPassword',
        name: 'Test User',
      };

      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockRejectedValue({
        name: 'ValidationError',
        errors: {
          email: { message: 'Invalid email format' },
        },
      });

      await expect(service.create(createUserDto)).rejects.toThrow();
    });

    it('should handle duplicate key errors with unknown field', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated Name' };

      userModel.findByIdAndUpdate.mockRejectedValue({
        code: 11000,
        keyPattern: { unknownField: 1 },
      });

      await expect(service.updateById(userId, updateData)).rejects.toThrow(
        new ConflictException('Duplicate key error'),
      );
    });
  });
});
