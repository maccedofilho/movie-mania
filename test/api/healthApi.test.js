import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Health API', () => {
  describe('GET /health', () => {
    it('deve retornar 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('deve retornar status ok no corpo', async () => {
      const res = await request(app).get('/health');
      expect(res.body).toHaveProperty('status', 'ok');
    });

    it('deve retornar JSON', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
