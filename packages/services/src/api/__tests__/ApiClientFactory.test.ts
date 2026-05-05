import { ApiClientFactory } from '../ApiClientFactory';
import { TodoApiClient } from '../TodoApiClient';
import { AuthApiClient } from '../AuthApiClient';
import { BaseApiClient } from '../BaseApiClient';

import axios from 'axios';

// Mock axios
jest.mock('axios');

(axios.create as jest.Mock).mockReturnValue({
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  defaults: { headers: { common: {} } },
});

describe('ApiClientFactory', () => {
  const mockConfig = {
    baseUrl: 'http://localhost:3001',
  };

  it('should initialize with defaults', () => {
    const factory = new ApiClientFactory(mockConfig);
    const config = factory.getConfig();

    expect(config.baseUrl).toBe('http://localhost:3001/api/v1');
    expect(config.environment).toBe('production');
    expect(config.version).toBe('v1');
    expect(config.timeout).toBe(30000);
  });

  it('should correctly handle baseUrl with existing /api/', () => {
    const factory = new ApiClientFactory({ baseUrl: 'http://localhost:3001/api/v2', version: 'v2' });
    expect(factory.getConfig().baseUrl).toBe('http://localhost:3001/api/v2');
  });

  it('should handle baseUrl without /api/', () => {
    const factory = new ApiClientFactory({ baseUrl: 'http://localhost:3001', version: 'v1' });
    expect(factory.getConfig().baseUrl).toBe('http://localhost:3001/api/v1');
  });

  it('should provide different clients', () => {
    const factory = new ApiClientFactory(mockConfig);

    const todoClient = factory.getTodoClient();
    expect(todoClient).toBeInstanceOf(TodoApiClient);

    const authClient = factory.getAuthClient();
    expect(authClient).toBeInstanceOf(AuthApiClient);

    const baseClient = factory.getBaseClient();
    expect(baseClient).toBeInstanceOf(BaseApiClient);
  });

  it('should cache client instances', () => {
    const factory = new ApiClientFactory(mockConfig);
    const client1 = factory.getTodoClient();
    const client2 = factory.getTodoClient();
    expect(client1).toBe(client2);
  });

  it('should set and clear auth token on all clients', () => {
    const factory = new ApiClientFactory(mockConfig);
    const todoClient = factory.getTodoClient();
    const authClient = factory.getAuthClient();

    const todoSpy = jest.spyOn(todoClient, 'setAuthToken');
    const authSpy = jest.spyOn(authClient, 'setAuthToken');

    factory.setAuthToken('token', 'refresh');
    expect(todoSpy).toHaveBeenCalledWith('token', 'refresh');
    expect(authSpy).toHaveBeenCalledWith('token', 'refresh');

    const todoClearSpy = jest.spyOn(todoClient, 'clearAuthToken');
    factory.clearAuthToken();
    expect(todoClearSpy).toHaveBeenCalled();
  });

  it('should update config and clear cache', () => {
    const factory = new ApiClientFactory(mockConfig);
    const client1 = factory.getTodoClient();

    factory.updateConfig({ version: 'v2' });
    const client2 = factory.getTodoClient();

    expect(client1).not.toBe(client2);
    expect(factory.getConfig().version).toBe('v2');
  });

  it('should add global interceptors', () => {
    const factory = new ApiClientFactory(mockConfig);
    const todoClient = factory.getTodoClient();
    const spy = jest.spyOn(todoClient, 'addRequestInterceptor');

    const interceptor = (config: any) => config;
    factory.addGlobalRequestInterceptor(interceptor);

    expect(spy).toHaveBeenCalledWith(interceptor);
  });

  it('should add global response and error interceptors to all clients', () => {
    const factory = new ApiClientFactory(mockConfig);
    const todoClient = factory.getTodoClient();
    const authClient = factory.getAuthClient();

    const todoResSpy = jest.spyOn(todoClient, 'addResponseInterceptor');
    const authResSpy = jest.spyOn(authClient, 'addResponseInterceptor');

    const interceptor = (res: any) => res;
    factory.addGlobalResponseInterceptor(interceptor);

    expect(todoResSpy).toHaveBeenCalledWith(interceptor);
    expect(authResSpy).toHaveBeenCalledWith(interceptor);
  });

  describe('static methods', () => {
    it('should create for environment', () => {
      const factory = ApiClientFactory.createForEnvironment('development', 'http://dev:3000');
      expect(factory.getConfig().environment).toBe('development');
      expect(factory.getConfig().timeout).toBe(60000);
    });

    it('should create for development', () => {
      const factory = ApiClientFactory.createForDevelopment(4000);
      expect(factory.getConfig().baseUrl).toBe('http://localhost:4000/api/v1');
    });
    it('should create for staging', () => {
      const factory = ApiClientFactory.createForEnvironment('staging', 'http://staging:3000');
      expect(factory.getConfig().environment).toBe('staging');
      expect(factory.getConfig().retryAttempts).toBe(3);
    });

    it('should create for production with overrides', () => {
      const factory = ApiClientFactory.createForEnvironment('production', 'https://api.example.com', {
        timeout: 10000,
      });
      expect(factory.getConfig().timeout).toBe(10000);
    });

    it('should create for development with overrides', () => {
      const factory = ApiClientFactory.createForDevelopment(3001, { version: 'v2' });
      expect(factory.getConfig().version).toBe('v2');
      expect(factory.getConfig().baseUrl).toBe('http://localhost:3001/api/v2');
    });
  });
});
