import { should } from 'chai';
import request from 'supertest';
import { app } from '../../src/app.js';

should();

describe('Health API (should)', () => {
  describe('GET /health', () => {
    it('deve retornar 200', async () => {
      const res = await request(app).get('/health');
      res.status.should.equal(200);
    });

    it('deve retornar status ok no corpo', async () => {
      const res = await request(app).get('/health');
      res.body.should.have.property('status', 'ok');
    });

    it('deve retornar JSON', async () => {
      const res = await request(app).get('/health');
      res.headers['content-type'].should.match(/application\/json/);
    });
  });
});
