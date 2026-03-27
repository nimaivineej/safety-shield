import { registerSchema, loginSchema, emergencyContactSchema, sosAlertSchema, validate } from '../validation';

describe('Validation Schemas', () => {

    describe('registerSchema', () => {
        it('should pass with valid data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Jane Doe',
                phone: '1234567890'
            };
            const result = registerSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail with invalid email', () => {
            const invalidEmail = {
                email: 'test-example',
                password: 'password123',
                name: 'Jane'
            };
            const result = registerSchema.safeParse(invalidEmail);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid email address');
            }
        });

        it('should fail with short password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: '123',
                name: 'Jane'
            };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        it('should pass with valid data', () => {
            const result = loginSchema.safeParse({ email: 'test@example.com', password: 'secretpassword' });
            expect(result.success).toBe(true);
        });

        it('should fail if email is omitted', () => {
            const result = loginSchema.safeParse({ password: 'secretpassword' });
            expect(result.success).toBe(false);
        });
    });

    describe('emergencyContactSchema', () => {
        it('should pass with valid data', () => {
            const validData = { name: 'John Doe', phone: '1234567890', relationship: 'Father' };
            const result = emergencyContactSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail with invalid phone', () => {
            const invalidData = { name: 'John Doe', phone: '12345', relationship: 'Father' };
            const result = emergencyContactSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('sosAlertSchema', () => {
        it('should pass with valid coordinates', () => {
            const validCoords = { latitude: 45.0, longitude: -90.0, address: 'Test Location' };
            const result = sosAlertSchema.safeParse(validCoords);
            expect(result.success).toBe(true);
        });

        it('should fail with out of bounds coordinates', () => {
            const invalidCoords = { latitude: 100.0, longitude: 200.0 };
            const result = sosAlertSchema.safeParse(invalidCoords);
            expect(result.success).toBe(false);
        });
    });

    describe('validate helper', () => {
        it('should parse valid data and return it', () => {
            const validator = validate(loginSchema);
            const validData = { email: 'test@example.com', password: 'test' };
            const result = validator(validData);
            expect(result).toEqual(validData);
        });

        it('should throw an error for invalid data', () => {
            const validator = validate(loginSchema);
            expect(() => {
                validator({ email: 'invalid', password: '' });
            }).toThrow();
        });
    });
});
