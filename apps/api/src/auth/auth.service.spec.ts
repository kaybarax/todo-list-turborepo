import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    walletAddress: '0x123',
    preferredNetwork: 'polygon' as const,
    settings: {
      theme: 'light' as const,
      notifications: true,
      defaultPriority: 'medium' as const,
    },
    isVerified: false,
    isActive: true,
    lastLoginAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    comparePassword: jest.fn(),
    toJSON: jest.fn(),
  } as any; // Mock UserDocument for testing - complex Mongoose Document interface

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findByWalletAddress: jest.fn(),
      findById: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      userService.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
          walletAddress: mockUser.walletAddress,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should handle registration with wallet address', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        walletAddress: '0x456',
      };

      userService.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      userService.create.mockResolvedValue({ ...mockUser, walletAddress: '0x456' });
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(userService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword',
      });
      expect(result.user.walletAddress).toBe('0x456');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
          walletAddress: mockUser.walletAddress,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully', async () => {
      const userId = mockUser._id;

      userService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(userId);

      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found during validation', async () => {
      const userId = 'nonexistent';

      userService.findById.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const oldToken = 'old-jwt-token';
      const payload = { sub: mockUser._id, email: mockUser.email };

      jwtService.verify.mockReturnValue(payload);
      userService.findByEmail.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refreshToken(oldToken);

      expect(jwtService.verify).toHaveBeenCalledWith(oldToken);
      expect(userService.findByEmail).toHaveBeenCalledWith(payload.email);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        access_token: 'new-jwt-token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
          walletAddress: mockUser.walletAddress,
        },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const invalidToken = 'invalid-token';

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(invalidToken)).rejects.toThrow(new UnauthorizedException('Invalid token'));

      expect(jwtService.verify).toHaveBeenCalledWith(invalidToken);
    });

    it('should throw UnauthorizedException if user not found during refresh', async () => {
      const oldToken = 'old-jwt-token';
      const payload = { sub: 'nonexistent', email: 'nonexistent@example.com' };

      jwtService.verify.mockReturnValue(payload);
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.refreshToken(oldToken)).rejects.toThrow(new UnauthorizedException('User not found'));

      expect(jwtService.verify).toHaveBeenCalledWith(oldToken);
      expect(userService.findByEmail).toHaveBeenCalledWith(payload.email);
    });
  });

  describe('error handling', () => {
    it('should handle database errors during registration', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      userService.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      userService.create.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow('Database error');
    });

    it('should handle bcrypt errors', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      userService.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockRejectedValue(new Error('Bcrypt error') as never);

      await expect(service.register(registerDto)).rejects.toThrow('Bcrypt error');
    });

    it('should handle JWT signing errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });

      await expect(service.login(loginDto)).rejects.toThrow('JWT error');
    });
  });
});
