process.env.NODE_ENV = 'test'; // Ensure server does not start during tests

import request from 'supertest';
import app from '../server';

describe('Integration Tests', () => {
    it('should return 200 on /health endpoint', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Server is running');
        expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 200 on /api-docs endpoint', async () => {
        const response = await request(app).get('/api-docs');
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('API Documentation');
        expect(response.body).toHaveProperty('endpoints');
    });
});
