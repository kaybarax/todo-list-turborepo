import { ApiError } from './ApiError';
import { BaseApiClient } from './BaseApiClient';
import {
  type ApiClientConfig,
  type ApiResponse,
  type User,
  type AuthResponse,
  type LoginInput,
  userSchema,
  authResponseSchema,
  loginInputSchema,
} from './types';

/**
 * Authentication API client
 */
export class AuthApiClient extends BaseApiClient {
  /**
   * Create a new AuthApiClient
   * @param config - API client configuration
   */
  constructor(config: ApiClientConfig) {
    super(config);
  }

  /**
   * Login with email and password or wallet signature
   * @param credentials - Login credentials
   */
  async login(credentials: LoginInput): Promise<ApiResponse<AuthResponse>> {
    try {
      // Validate input data
      const result = loginInputSchema.safeParse(credentials);
      if (!result.success) {
        throw ApiError.validationError(`Invalid login credentials: ${result.error.message}`);
      }

      const response = await this.post<AuthResponse>('/auth/login', result.data);

      // Validate response data
      if (response.success && response.data) {
        const authResult = authResponseSchema.safeParse(response.data);
        if (!authResult.success) {
          throw ApiError.validationError(`Invalid auth response: ${authResult.error.message}`);
        }

        // Set the auth token for future requests
        const token = (authResult.data.access_token || authResult.data.token) ?? '';
        this.setAuthToken(token, authResult.data.refreshToken);

        return {
          ...response,
          data: authResult.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to login', error);
    }
  }

  /**
   * Register a new user
   * @param userData - User registration data
   */
  async register(userData: {
    email?: string;
    walletAddress?: string;
    signature?: string;
    message?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    try {
      // Validate input data
      const result = loginInputSchema.safeParse(userData);
      if (!result.success) {
        throw ApiError.validationError(`Invalid registration data: ${result.error.message}`);
      }

      const response = await this.post<AuthResponse>('/auth/register', result.data);

      // Validate response data
      if (response.success && response.data) {
        const authResult = authResponseSchema.safeParse(response.data);
        if (!authResult.success) {
          throw ApiError.validationError(`Invalid auth response: ${authResult.error.message}`);
        }

        // Set the auth token for future requests
        const token = (authResult.data.access_token || authResult.data.token) ?? '';
        this.setAuthToken(token, authResult.data.refreshToken);

        return {
          ...response,
          data: authResult.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to register', error);
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await this.post<void>('/auth/logout');

      // Clear the auth token
      this.clearAuthToken();

      return response;
    } catch (error) {
      // Clear the auth token even if logout fails
      this.clearAuthToken();

      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to logout', error);
    }
  }

  /**
   * Refresh the authentication token
   */
  async refreshUserToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw ApiError.authenticationError('No refresh token available');
      }

      const response = await this.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });

      // Validate response data
      if (response.success && response.data) {
        const authResult = authResponseSchema.safeParse(response.data);
        if (!authResult.success) {
          throw ApiError.validationError(`Invalid auth response: ${authResult.error.message}`);
        }

        // Update the auth token
        const token = (authResult.data.access_token || authResult.data.token) ?? '';
        this.setAuthToken(token, authResult.data.refreshToken);

        return {
          ...response,
          data: authResult.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to refresh token', error);
    }
  }

  /**
   * Get the current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.get<User>('/auth/profile');

      // Validate response data
      if (response.success && response.data) {
        const result = userSchema.safeParse(response.data);
        if (!result.success) {
          throw ApiError.validationError(`Invalid user data: ${result.error.message}`);
        }

        return {
          ...response,
          data: result.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to get user profile', error);
    }
  }

  /**
   * Update the current user profile
   * @param userData - Updated user data
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.put<User>('/auth/profile', userData);

      // Validate response data
      if (response.success && response.data) {
        const result = userSchema.safeParse(response.data);
        if (!result.success) {
          throw ApiError.validationError(`Invalid user data: ${result.error.message}`);
        }

        return {
          ...response,
          data: result.data,
        };
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to update user profile', error);
    }
  }

  /**
   * Request password reset
   * @param email - User email
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.post<void>('/auth/password-reset', { email });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to request password reset', error);
    }
  }

  /**
   * Reset password with token
   * @param token - Reset token
   * @param newPassword - New password
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.post<void>('/auth/password-reset/confirm', {
        token,
        password: newPassword,
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to reset password', error);
    }
  }

  /**
   * Verify email address
   * @param token - Verification token
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.post<void>('/auth/verify-email', { token });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to verify email', error);
    }
  }

  /**
   * Get wallet authentication message
   * @param walletAddress - Wallet address
   */
  async getWalletAuthMessage(walletAddress: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.post<{ message: string }>('/auth/wallet/message', {
        walletAddress,
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unknownError('Failed to get wallet auth message', error);
    }
  }

  /**
   * Get refresh token (private method for internal use)
   */
  private getRefreshToken(): string | null {
    // This would typically be stored securely
    // For now, we'll assume it's stored in the base client
    return ((this as Record<string, unknown>).refreshToken as string | null) ?? null;
  }
}
