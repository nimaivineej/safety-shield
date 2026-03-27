import { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError } from '../errors';

describe('Custom Error Classes', () => {
    it('AppError should correctly assign message and status code', () => {
        const error = new AppError('General Error', 500);
        expect(error.message).toBe('General Error');
        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
    });

    it('ValidationError should set status code to 400', () => {
        const error = new ValidationError('Bad Request');
        expect(error.message).toBe('Bad Request');
        expect(error.statusCode).toBe(400);
    });

    it('AuthenticationError should set default message and status code 401', () => {
        const error = new AuthenticationError();
        expect(error.message).toBe('Authentication failed');
        expect(error.statusCode).toBe(401);

        const customError = new AuthenticationError('Invalid token');
        expect(customError.message).toBe('Invalid token');
    });

    it('AuthorizationError should set default message and status code 403', () => {
        const error = new AuthorizationError();
        expect(error.message).toBe('Access denied');
        expect(error.statusCode).toBe(403);
    });

    it('NotFoundError should set default message and status code 404', () => {
        const error = new NotFoundError();
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
    });

    it('ConflictError should set status code 409', () => {
        const error = new ConflictError('Resource already exists');
        expect(error.message).toBe('Resource already exists');
        expect(error.statusCode).toBe(409);
    });
});
