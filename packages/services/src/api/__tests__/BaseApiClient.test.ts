import { BaseApiClient } from '../BaseApiClient';
import { ApiError } from '../ApiError';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BaseApiClient', () => {
  let client: BaseApiClient;
  const mockConfig = {
    baseUrl: 'http://localhost:3001',
    timeout: 1000,
    retryAttempts: 1,
    retryDelay: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      defaults: { headers: { common: {} } },
      post: jest.fn(),
    } as any);
    client = new BaseApiClient(mockConfig);
  });

  describe('auth tokens', () => {
    it('should set and clear auth token', () => {
      client.setAuthToken('token', 'refresh');
      expect(client.getAuthToken()).toBe('token');

      client.clearAuthToken();
      expect(client.getAuthToken()).toBeNull();
    });

    it('should add auth header if token is present', async () => {
      client.setAuthToken('token');
      const config: any = { headers: {} };
      const requestInterceptor = (client as any).client.interceptors.request.use.mock.calls[0][0];
      const modifiedConfig = await requestInterceptor(config);
      expect(modifiedConfig.headers.Authorization).toBe('Bearer token');
    });
  });

  describe('interceptors', () => {
    it('should add interceptors', () => {
      const requestInterceptor = (config: any) => config;
      const responseInterceptor = (response: any) => response;
      const errorInterceptor = (error: any) => error;

      client.addRequestInterceptor(requestInterceptor);
      client.addResponseInterceptor(responseInterceptor);
      client.addErrorInterceptor(errorInterceptor);

      expect((client as any).requestInterceptors).toContain(requestInterceptor);
      expect((client as any).responseInterceptors).toContain(responseInterceptor);
      expect((client as any).errorInterceptors).toContain(errorInterceptor);
    });
  });

  describe('request methods', () => {
    it('should perform GET request', async () => {
      const spy = jest.spyOn(client as any, 'request').mockResolvedValue({ success: true });
      await client.get('/test');
      expect(spy).toHaveBeenCalledWith('GET', '/test', undefined, undefined);
    });

    it('should perform POST request', async () => {
      const spy = jest.spyOn(client as any, 'request').mockResolvedValue({ success: true });
      await client.post('/test', { data: 'test' });
      expect(spy).toHaveBeenCalledWith('POST', '/test', { data: 'test' }, undefined);
    });

    it('should perform PUT request', async () => {
      const spy = jest.spyOn(client as any, 'request').mockResolvedValue({ success: true });
      await client.put('/test', { data: 'test' });
      expect(spy).toHaveBeenCalledWith('PUT', '/test', { data: 'test' }, undefined);
    });

    it('should perform PATCH request', async () => {
      const spy = jest.spyOn(client as any, 'request').mockResolvedValue({ success: true });
      await client.patch('/test', { data: 'test' });
      expect(spy).toHaveBeenCalledWith('PATCH', '/test', { data: 'test' }, undefined);
    });

    it('should perform DELETE request', async () => {
      const spy = jest.spyOn(client as any, 'request').mockResolvedValue({ success: true });
      await client.delete('/test');
      expect(spy).toHaveBeenCalledWith('DELETE', '/test', undefined, undefined);
    });
  });

  describe('request execution and retry', () => {
    it('should handle successful response', async () => {
      const mockResponse = { data: { success: true, data: 'result' } };
      (client as any).client.request.mockResolvedValue(mockResponse);

      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toBe('result');
    });

    it('should wrap raw data in ApiResponse', async () => {
      const mockResponse = { data: 'raw-result' };
      (client as any).client.request.mockResolvedValue(mockResponse);

      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toBe('raw-result');
    });

    it('should retry on failure', async () => {
      const networkError = new Error('Network error');
      (client as any).client.request
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect((client as any).client.request).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors (4xx)', async () => {
      const clientError = { response: { status: 400 } };
      (client as any).client.request.mockRejectedValue(clientError);

      await expect(client.get('/test')).rejects.toThrow();
      expect((client as any).client.request).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors (5xx)', async () => {
      const serverError = { response: { status: 500 } };
      (client as any).client.request
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect((client as any).client.request).toHaveBeenCalledTimes(2);
    });

    it('should throw ApiError after all retries fail', async () => {
      (client as any).client.request.mockRejectedValue(new Error('Persistent failure'));

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      expect((client as any).client.request).toHaveBeenCalledTimes(2); // 0 + 1 retry
    });
    it('should return data as is if it already has success field', async () => {
      const mockResponse = { data: { success: true, data: 'existing' } };
      (client as any).client.request.mockResolvedValue(mockResponse);

      const result = await client.get('/test');
      expect(result.data).toBe('existing');
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle timeout error', () => {
      const timeoutError = { code: 'ECONNABORTED' };
      const result = (client as any).handleError(timeoutError);
      expect(result.type).toBe('timeout_error');
    });

    it('should handle timeout error from message', () => {
      const timeoutError = { message: 'timeout of 5000ms exceeded' };
      const result = (client as any).handleError(timeoutError);
      expect(result.type).toBe('timeout_error');
    });

    it('should handle network error (no response)', () => {
      const networkError = new Error('No connection');
      const result = (client as any).handleError(networkError);
      expect(result.type).toBe('network_error');
    });

    it('should handle token refresh on 401', async () => {
      client.setAuthToken('old-token', 'refresh-token');
      const authError = {
        response: { status: 401 },
        config: { url: '/test' },
      };
      (client as any).refreshAuthToken = jest.fn().mockResolvedValue(undefined);
      (client as any).client.request = jest.fn().mockResolvedValue({ data: { success: true } });

      const responseInterceptor = (client as any).client.interceptors.response.use.mock.calls[0][1];
      await responseInterceptor(authError);

      expect((client as any).refreshAuthToken).toHaveBeenCalled();
      expect((client as any).client.request).toHaveBeenCalledWith(authError.config);
    });

    it('should handle refresh failure', async () => {
      client.setAuthToken('old-token', 'refresh-token');
      const authError = { response: { status: 401 }, config: {} };
      (client as any).refreshAuthToken = jest.fn().mockRejectedValue(new Error('Refresh failed'));

      const responseInterceptor = (client as any).client.interceptors.response.use.mock.calls[0][1];
      await expect(responseInterceptor(authError)).rejects.toThrow('Refresh failed');
      expect(client.getAuthToken()).toBeNull();
    });

    it('should run multiple request and response interceptors', async () => {
      const req1 = jest.fn().mockImplementation(c => c);
      const req2 = jest.fn().mockImplementation(c => ({ ...c, x: 1 }));
      client.addRequestInterceptor(req1);
      client.addRequestInterceptor(req2);

      (client as any).client.request.mockResolvedValue({ data: { success: true } });

      const requestInterceptor = (client as any).client.interceptors.request.use.mock.calls[0][0];
      const result = await requestInterceptor({ headers: {} });
      expect(req1).toHaveBeenCalled();
      expect(req2).toHaveBeenCalled();
      expect(result.x).toBe(1);
    });

    it('should run error interceptors', async () => {
      const errInterceptor = jest.fn().mockImplementation(e => e);
      client.addErrorInterceptor(errInterceptor);

      const errorInterceptor = (client as any).client.interceptors.response.use.mock.calls[0][1];
      const error = new Error('fail');
      await expect(errorInterceptor(error)).rejects.toThrow();
      expect(errInterceptor).toHaveBeenCalled();
    });

    it('should handle shouldRetry with various status codes', () => {
      const shouldRetry = (client as any).shouldRetry.bind(client);
      expect(shouldRetry({ response: { status: 500 } })).toBe(true);
      expect(shouldRetry({ response: { status: 503 } })).toBe(true);
      expect(shouldRetry({ response: { status: 400 } })).toBe(false);
      expect(shouldRetry({ response: { status: 401 } })).toBe(false);
      expect(shouldRetry({})).toBe(true); // Network error
    });

    it('should use linear backoff if configured', async () => {
      (client as any).client.request
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await (client as any).request('GET', '/test', undefined, undefined, {
        attempts: 1,
        delay: 5,
        backoff: 'linear',
      });
      expect(result.success).toBe(true);
    });

    it('should handle non-Error error objects', async () => {
      (client as any).client.request.mockRejectedValue('string error');
      await expect(client.get('/test')).rejects.toThrow(ApiError);
    });

    it('should throw if retryCondition returns false', async () => {
      const error = new Error('fail');
      (client as any).client.request.mockRejectedValue(error);

      await expect(
        (client as any).request('GET', '/test', undefined, undefined, {
          attempts: 1,
          retryCondition: () => false,
        }),
      ).rejects.toThrow(ApiError);

      expect((client as any).client.request).toHaveBeenCalledTimes(1);
    });

    it('should use custom retry config', async () => {
      (client as any).client.request
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await client.get('/test', {}, { attempts: 1, delay: 5 });
      expect(result.success).toBe(true);
      expect((client as any).client.request).toHaveBeenCalledTimes(2);
    });

    it('should use linear backoff if specified', async () => {
      const bClient = new BaseApiClient({ ...mockConfig, retryAttempts: 1, retryDelay: 1 });
      (bClient as any).client.request = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ data: { success: true } });

      await bClient.get('/test', {}, { backoff: 'linear' });
      expect((bClient as any).client.request).toHaveBeenCalledTimes(2);
    });

    it('should add Authorization header if token is set', async () => {
      client.setAuthToken('token123');
      const requestInterceptor = (client as any).client.interceptors.request.use.mock.calls[0][0];
      const config = await requestInterceptor({ headers: {} });
      expect(config.headers.Authorization).toBe('Bearer token123');
    });

    it('should handle missing headers in request interceptor', async () => {
      client.setAuthToken('token123');
      const requestInterceptor = (client as any).client.interceptors.request.use.mock.calls[0][0];
      const config = await requestInterceptor({});
      expect(config.headers.Authorization).toBe('Bearer token123');
    });

    it('should wrap non-standard success response', async () => {
      (client as any).client.request.mockResolvedValue({ data: { foo: 'bar' } });
      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ foo: 'bar' });
    });

    it('should handle response that is not an object', async () => {
      (client as any).client.request.mockResolvedValue({ data: 'plain text' });
      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toBe('plain text');
    });

    it('should handle timeout error with code ECONNABORTED', async () => {
      const error = new Error('timeout');
      (error as any).code = 'ECONNABORTED';
      (client as any).client.request.mockRejectedValue(error);
      await expect(client.get('/test')).rejects.toThrow(ApiError);
      try {
        await client.get('/test');
      } catch (e: any) {
        expect(e.type).toBe('timeout_error');
      }
    });

    it('should handle timeout error with message "timeout"', async () => {
      const error = { message: 'request timeout' };
      (client as any).client.request.mockRejectedValue(error);
      await expect(client.get('/test')).rejects.toThrow(ApiError);
    });

    it('should retry on 500 status', () => {
      const shouldRetry = (client as any).shouldRetry.bind(client);
      expect(shouldRetry({ response: { status: 500 } })).toBe(true);
    });

    it('should retry on undefined status (network error)', () => {
      const shouldRetry = (client as any).shouldRetry.bind(client);
      expect(shouldRetry({})).toBe(true);
    });

    it('should handle undefined headers in request interceptor', async () => {
      client.setAuthToken('token123');
      const requestInterceptor = (client as any).client.interceptors.request.use.mock.calls[0][0];
      const config = await requestInterceptor({ headers: undefined });
      expect(config.headers.Authorization).toBe('Bearer token123');
    });

    it('should not refresh token if status is not 401', async () => {
      client.setAuthToken('t', 'r');
      const responseInterceptor = (client as any).client.interceptors.response.use.mock.calls[0][1];
      const error = { response: { status: 403 }, config: {} };
      await expect(responseInterceptor(error)).rejects.toBeDefined();
    });

    it('should not refresh token if refreshToken is missing', async () => {
      client.setAuthToken('t'); // no refresh token
      const responseInterceptor = (client as any).client.interceptors.response.use.mock.calls[0][1];
      const error = { response: { status: 401 }, config: {} };
      await expect(responseInterceptor(error)).rejects.toBeDefined();
    });

    it('should return raw response if data is null', async () => {
      const response = { data: null };
      const result = (client as any).handleResponse(response);
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return raw response if data is not an object (e.g. number)', async () => {
      const response = { data: 123 };
      const result = (client as any).handleResponse(response);
      expect(result.success).toBe(true);
      expect(result.data).toBe(123);
    });

    it('should not retry on 401 status', () => {
      const shouldRetry = (client as any).shouldRetry.bind(client);
      expect(shouldRetry({ response: { status: 401 } })).toBe(false);
    });

    it('should not retry on 400 status', () => {
      const shouldRetry = (client as any).shouldRetry.bind(client);
      expect(shouldRetry({ response: { status: 400 } })).toBe(false);
    });

    it('should not retry on 499 status', () => {
      const shouldRetry = (client as any).shouldRetry.bind(client);
      expect(shouldRetry({ response: { status: 499 } })).toBe(false);
    });

    it('should retry on 501 status', () => {
      const shouldRetry = (client as any).shouldRetry.bind(client);
      expect(shouldRetry({ response: { status: 501 } })).toBe(true);
    });
  });
});
