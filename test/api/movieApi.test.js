import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';

describe('Movie API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  describe('POST /movies', () => {
    it('deve criar um filme e retornar 201', async () => {
      const res = await request(app)
        .post('/movies')
        .send({ title: 'Matrix', director: 'Wachowski', year: 1999 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Matrix');
      expect(res.body.director).toBe('Wachowski');
      expect(res.body.year).toBe(1999);
    });

    it('deve retornar 400 quando dados forem inválidos', async () => {
      const res = await request(app).post('/movies').send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /movies', () => {
    it('deve retornar 200 e uma lista de filmes', async () => {
      const res = await request(app).get('/movies');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /movies/:id', () => {
    it('deve retornar 200 e o filme quando existir', async () => {
      const created = await request(app)
        .post('/movies')
        .send({ title: 'Inception', director: 'Nolan', year: 2010 });

      const res = await request(app).get(`/movies/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Inception');
    });

    it('deve retornar 404 quando o filme não existir', async () => {
      const res = await request(app).get('/movies/999999');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /movies/:id', () => {
    it('deve atualizar o filme e retornar 200', async () => {
      const created = await request(app)
        .post('/movies')
        .send({ title: 'Old', director: 'X', year: 2000 });

      const res = await request(app)
        .put(`/movies/${created.body.id}`)
        .send({ title: 'Novo Título' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Novo Título');
    });

    it('deve retornar 404 ao atualizar filme inexistente', async () => {
      const res = await request(app)
        .put('/movies/999999')
        .send({ title: 'Qualquer' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /movies/:id', () => {
    it('deve deletar o filme e retornar 204', async () => {
      const created = await request(app)
        .post('/movies')
        .send({ title: 'Descartável', director: 'X', year: 2005 });

      const res = await request(app).delete(`/movies/${created.body.id}`);

      expect(res.status).toBe(204);
    });

    it('deve retornar 404 ao deletar filme inexistente', async () => {
      const res = await request(app).delete('/movies/999999');

      expect(res.status).toBe(404);
    });
  });
});
