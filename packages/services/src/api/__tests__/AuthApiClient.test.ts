// @ts-nocheck
import { ApiError } from '../ApiError';
import { AuthApiClient } from '../AuthApiClient';
import { type AuthResponse, type User } from '../types';

describe('AuthApiClient', () => {
  let client: AuthApiClient;
  const mockConfig = {
    baseUrl: 'http://localhost:3001/api/v1',
    timeout: 5000,
  };

  const mockUser: User = {
    id: 'user1',
    email: 'test@example.com',
    settings: {
      theme: 'light',
      notifications: true,
      defaultPriority: 'medium',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    access_token: 'mock-jwt-token',
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(() => {
    client = new AuthApiClient(mockConfig);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const setAuthTokenSpy = jest.spyOn(client, 'setAuthToken');
      jest.spyOn(client as any, 'post').mockResolvedValue({
        success: true,
        data: mockAuthResponse,
      });

      const result = await client.login({ email: 'test@example.com', password: 'password' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuthResponse);
      expect(setAuthTokenSpy).toHaveBeenCalledWith(mockAuthResponse.access_token, mockAuthResponse.refreshToken);
    });

    it('should throw validation error if login response is invalid', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true, data: { user: { id: '1' } } });
      await expect(client.login({ email: 'test@example.com', password: 'password' })).rejects.toThrow(ApiError);
    });

    it('should throw validation error if login input is invalid', async () => {
      await expect(client.login({ email: 'invalid', password: '1' })).rejects.toThrow(ApiError);
    });

    it('should return raw response if login success is false', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: false });
      const result = await client.login({ email: 'test@example.com', password: 'password' });
      expect(result.success).toBe(false);
    });

    it('should handle login failure', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue(new Error('fail'));
      await expect(client.login({ email: 'test@example.com', password: 'password' })).rejects.toThrow(ApiError);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const setAuthTokenSpy = jest.spyOn(client, 'setAuthToken');
      jest.spyOn(client as any, 'post').mockResolvedValue({
        success: true,
        data: mockAuthResponse,
      });

      const registerInput = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };

      const result = await client.register(registerInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuthResponse);
      expect(setAuthTokenSpy).toHaveBeenCalledWith(mockAuthResponse.access_token, mockAuthResponse.refreshToken);
    });

    it('should handle fallback to token and missing data', async () => {
      jest
        .spyOn(client as any, 'post')
        .mockResolvedValue({ success: true, data: { ...mockAuthResponse, access_token: '' } });
      await client.register({ email: 'test@example.com', password: 'password', name: 'Test User' });

      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true, data: null });
      const result = await client.register({ email: 'test@example.com', password: 'password', name: 'Test User' });
      expect(result.data).toBeNull();
    });

    it('should handle register failure', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue(new Error('fail'));
      await expect(
        client.register({ email: 'test@example.com', password: 'password', name: 'Test User' }),
      ).rejects.toThrow(ApiError);
    });

    it('should throw validation error if registration input is invalid', async () => {
      await expect(client.register({ email: 'invalid' })).rejects.toThrow(ApiError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const clearAuthTokenSpy = jest.spyOn(client, 'clearAuthToken');
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true });

      const result = await client.logout();

      expect(result.success).toBe(true);
      expect(clearAuthTokenSpy).toHaveBeenCalled();
    });

    it('should handle logout failure', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue(new Error('fail'));
      await expect(client.logout()).rejects.toThrow(ApiError);
    });
  });

  describe('refreshUserToken', () => {
    it('should refresh token successfully', async () => {
      jest.spyOn(client as any, 'getRefreshToken').mockReturnValue('mock-refresh-token');
      jest.spyOn(client as any, 'post').mockResolvedValue({
        success: true,
        data: mockAuthResponse,
      });

      const result = await client.refreshUserToken();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuthResponse);
    });

    it('should throw error if refresh token is missing', async () => {
      jest.spyOn(client as any, 'getRefreshToken').mockReturnValue(null);
      await expect(client.refreshUserToken()).rejects.toThrow(ApiError);
    });

    it('should handle refresh failure', async () => {
      jest.spyOn(client as any, 'getRefreshToken').mockReturnValue('r');
      jest.spyOn(client as any, 'post').mockRejectedValue(new Error('fail'));
      await expect(client.refreshUserToken()).rejects.toThrow(ApiError);
    });
  });

  describe('getProfile', () => {
    it('should get profile successfully', async () => {
      jest.spyOn(client as any, 'get').mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const result = await client.getProfile();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should return raw response if success is false', async () => {
      jest.spyOn(client as any, 'get').mockResolvedValue({ success: false });
      const result = await client.getProfile();
      expect(result.success).toBe(false);
    });

    it('should handle success true with data null in getProfile', async () => {
      jest.spyOn(client as any, 'get').mockResolvedValue({ success: true, data: null });
      const result = await client.getProfile();
      expect(result.data).toBeNull();
    });

    it('should handle success false in getProfile', async () => {
      jest.spyOn(client as any, 'get').mockResolvedValue({ success: false });
      const result = await client.getProfile();
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = { email: 'new@example.com' };
      jest.spyOn(client as any, 'put').mockResolvedValue({
        success: true,
        data: { ...mockUser, ...updateData },
      });

      const result = await client.updateProfile(updateData);

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('new@example.com');
    });

    it('should handle success true with data null in updateProfile', async () => {
      jest.spyOn(client as any, 'put').mockResolvedValue({ success: true, data: null });
      const result = await client.updateProfile({});
      expect(result.data).toBeNull();
    });

    it('should handle success false in updateProfile', async () => {
      jest.spyOn(client as any, 'put').mockResolvedValue({ success: false });
      const result = await client.updateProfile({});
      expect(result.success).toBe(false);
    });

    it('should handle updateProfile failure', async () => {
      jest.spyOn(client as any, 'put').mockRejectedValue(new Error('fail'));
      await expect(client.updateProfile({})).rejects.toThrow(ApiError);
    });
  });

  describe('password reset', () => {
    it('should request password reset', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true });
      const result = await client.requestPasswordReset('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should handle requestPasswordReset failure', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue(new Error('fail'));
      await expect(client.requestPasswordReset('e')).rejects.toThrow(ApiError);
    });

    it('should reset password', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true });
      const result = await client.resetPassword('token', 'new-password');
      expect(result.success).toBe(true);
    });

    it('should handle resetPassword failure', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue(new Error('fail'));
      await expect(client.resetPassword('t', 'p')).rejects.toThrow(ApiError);
    });
  });

  describe('email verification', () => {
    it('should verify email', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true });
      const result = await client.verifyEmail('token');
      expect(result.success).toBe(true);
    });

    it('should handle verifyEmail failure', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue(new Error('fail'));
      await expect(client.verifyEmail('t')).rejects.toThrow(ApiError);
    });
  });

  describe('wallet auth', () => {
    it('should get wallet auth message', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({
        success: true,
        data: { message: 'sign this' },
      });
      const result = await client.getWalletAuthMessage('0x123');
      expect(result.success).toBe(true);
    });

    it('should handle non-ApiError in wallet auth', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('string error');
      await expect(client.getWalletAuthMessage('0x123')).rejects.toThrow(ApiError);
    });
  });

  describe('catch blocks coverage', () => {
    it('should handle non-ApiError in login', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.login({ email: 't@t.com', password: 'p' })).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in register', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.register({ email: 't@t.com', password: 'p', name: 'n' })).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in logout', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.logout()).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in refreshUserToken', async () => {
      jest.spyOn(client as any, 'getRefreshToken').mockReturnValue('r');
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.refreshUserToken()).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in getProfile', async () => {
      jest.spyOn(client as any, 'get').mockRejectedValue('fail');
      await expect(client.getProfile()).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in updateProfile', async () => {
      jest.spyOn(client as any, 'put').mockRejectedValue('fail');
      await expect(client.updateProfile({})).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in requestPasswordReset', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.requestPasswordReset('e')).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in resetPassword', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.resetPassword('t', 'p')).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in verifyEmail', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.verifyEmail('t')).rejects.toThrow(ApiError);
    });
  });
});
