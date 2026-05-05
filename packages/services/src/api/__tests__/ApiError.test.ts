import { ApiError, ApiErrorType } from '../ApiError';

describe('ApiError', () => {
  describe('static factory methods', () => {
    it('should create network error', () => {
      const error = ApiError.networkError('network');
      expect(error.type).toBe(ApiErrorType.NETWORK_ERROR);
    });

    it('should create timeout error', () => {
      const error = ApiError.timeoutError('timeout');
      expect(error.type).toBe(ApiErrorType.TIMEOUT_ERROR);
      expect(error.statusCode).toBe(408);
    });

    it('should create authentication error', () => {
      const error = ApiError.authenticationError('auth');
      expect(error.type).toBe(ApiErrorType.AUTHENTICATION_ERROR);
      expect(error.statusCode).toBe(401);
    });

    it('should create authorization error', () => {
      const error = ApiError.authorizationError('auth');
      expect(error.type).toBe(ApiErrorType.AUTHORIZATION_ERROR);
      expect(error.statusCode).toBe(403);
    });

    it('should create validation error', () => {
      const error = ApiError.validationError('valid');
      expect(error.type).toBe(ApiErrorType.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should create not found error', () => {
      const error = ApiError.notFoundError('not found');
      expect(error.type).toBe(ApiErrorType.NOT_FOUND_ERROR);
      expect(error.statusCode).toBe(404);
    });

    it('should create server error', () => {
      const error = ApiError.serverError('server');
      expect(error.type).toBe(ApiErrorType.SERVER_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should create unknown error', () => {
      const error = ApiError.unknownError('unknown');
      expect(error.type).toBe(ApiErrorType.UNKNOWN_ERROR);
    });
  });

  describe('fromResponse', () => {
    it('should map 401 to authentication error', () => {
      const error = ApiError.fromResponse(401, { error: 'Unauthorized' });
      expect(error.type).toBe(ApiErrorType.AUTHENTICATION_ERROR);
    });

    it('should map 403 to authorization error', () => {
      const error = ApiError.fromResponse(403, { error: 'Forbidden' });
      expect(error.type).toBe(ApiErrorType.AUTHORIZATION_ERROR);
    });

    it('should map 400 to validation error', () => {
      const error = ApiError.fromResponse(400, { error: 'Bad Request' });
      expect(error.type).toBe(ApiErrorType.VALIDATION_ERROR);
    });

    it('should map 404 to not found error', () => {
      const error = ApiError.fromResponse(404, { error: 'Not Found' });
      expect(error.type).toBe(ApiErrorType.NOT_FOUND_ERROR);
    });

    it('should map 5xx to server error', () => {
      const error = ApiError.fromResponse(502, { error: 'Bad Gateway' });
      expect(error.type).toBe(ApiErrorType.SERVER_ERROR);
    });

    it('should map others to unknown error', () => {
      const error = ApiError.fromResponse(418, { error: "I'm a teapot" });
      expect(error.type).toBe(ApiErrorType.UNKNOWN_ERROR);
    });

    it('should use message if error field is missing', () => {
      const error = ApiError.fromResponse(400, { message: 'Alt message' });
      expect(error.message).toBe('Alt message');
    });

    it('should use default message if both missing', () => {
      const error = ApiError.fromResponse(400, {});
      expect(error.message).toBe('An error occurred');
    });

    it('should use default message if data is null', () => {
      const error = ApiError.fromResponse(400, null);
      expect(error.message).toBe('An error occurred');
    });
  });

  describe('factory methods', () => {
    it('should create authentication error', () => {
      const error = ApiError.authenticationError('Auth failed');
      expect(error.type).toBe('authentication_error');
    });

    it('should create authorization error', () => {
      const error = ApiError.authorizationError('Auth failed');
      expect(error.type).toBe('authorization_error');
    });

    it('should create validation error', () => {
      const error = ApiError.validationError('Invalid');
      expect(error.type).toBe('validation_error');
    });

    it('should create not found error', () => {
      const error = ApiError.notFoundError('Missing');
      expect(error.type).toBe('not_found_error');
    });

    it('should create server error', () => {
      const error = ApiError.serverError('Broken', 500);
      expect(error.type).toBe('server_error');
      expect(error.statusCode).toBe(500);
    });

    it('should create network error', () => {
      const error = ApiError.networkError('Offline');
      expect(error.type).toBe('network_error');
    });

    it('should create timeout error', () => {
      const error = ApiError.timeoutError('Slow');
      expect(error.type).toBe('timeout_error');
    });

    it('should use message field in fromResponse if error field is missing', () => {
      const error = ApiError.fromResponse(500, { message: 'msg' });
      expect(error.message).toBe('msg');
    });

    it('should use default message in fromResponse if both fields are missing', () => {
      const error = ApiError.fromResponse(500, {});
      expect(error.message).toBe('An error occurred');
    });

    it('should handle non-object response data in fromResponse', () => {
      const error = ApiError.fromResponse(500, 'plain string');
      expect(error.message).toBe('An error occurred');
    });
  });
});
