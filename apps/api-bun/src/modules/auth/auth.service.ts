import { UnauthorizedError, ConflictError } from '../../plugins/errors';
import { type RegisterBody, type LoginBody, type AuthResponse } from '../../schemas/auth';
import { type UserDocument } from '../user/user.model';
import { userService, type UserService } from '../user/user.service';

export interface JwtSigner {
  sign(payload: { sub: string; email: string }): Promise<string>;
}

export class AuthService {
  constructor(private readonly userService: UserService) {}

  /**
   * Register a new user
   */
  async register(body: RegisterBody, jwt: JwtSigner): Promise<AuthResponse> {
    const { email } = body;

    // Check if user exists first (matches NestJS flow)
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const user = await this.userService.create(body);

    return this.generateTokenResponse(user, jwt);
  }

  /**
   * Login a user
   */
  async login(body: LoginBody, jwt: JwtSigner): Promise<AuthResponse> {
    const { email, password } = body;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password using Bun's native password utility
    const isValid = await Bun.password.verify(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await this.userService.updateLastLogin(user.id);

    return this.generateTokenResponse(user, jwt);
  }

  /**
   * Refresh token
   */
  async refreshToken(userId: string, jwt: JwtSigner): Promise<AuthResponse> {
    try {
      const user = await this.userService.findById(userId);
      return this.generateTokenResponse(user, jwt);
    } catch (_) {
      // If user was deleted after token was issued
      throw new UnauthorizedError('User not found');
    }
  }

  /**
   * Generate authentication response with token and user info
   */
  private async generateTokenResponse(user: UserDocument, jwt: JwtSigner): Promise<AuthResponse> {
    const token = await jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
      },
    };
  }
}

export const authService = new AuthService(userService);
