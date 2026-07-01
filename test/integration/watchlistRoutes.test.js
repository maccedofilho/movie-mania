import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/modules/watchlist/watchlistService.js', () => ({
  add: vi.fn(),
  getById: vi.fn(),
  markAsWatched: vi.fn(),
  remove: vi.fn(),
  listByUser: vi.fn(),
}));

const { app } = await import('../../src/app.js');
const watchlistService = await import('../../src/modules/watchlist/watchlistService.js');

describe('Watchlist Routes (integração com service mockado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /watchlist', () => {
    it('deve retornar 201 e o item criado em caso de sucesso', async () => {
      watchlistService.add.mockResolvedValue({
        id: 1, userId: 5, movieId: 10, status: 'to_watch',
      });

      const res = await request(app)
        .post('/watchlist')
        .send({ userId: 5, movieId: 10 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body.status).toBe('to_watch');
      expect(watchlistService.add).toHaveBeenCalledWith(5, 10);
    });

    it('deve retornar 400 quando userId estiver ausente', async () => {
      const res = await request(app)
        .post('/watchlist')
        .send({ movieId: 10 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(watchlistService.add).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando movieId estiver ausente', async () => {
      const res = await request(app)
        .post('/watchlist')
        .send({ userId: 5 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(watchlistService.add).not.toHaveBeenCalled();
    });

    it('deve retornar 409 quando o filme já estiver na watchlist', async () => {
      const err = new Error('duplicado');
      err.name = 'SequelizeUniqueConstraintError';
      watchlistService.add.mockRejectedValue(err);

      const res = await request(app)
        .post('/watchlist')
        .send({ userId: 5, movieId: 10 });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/já está/);
    });

    it('deve retornar 400 quando o service lançar erro de validação', async () => {
      const err = new Error('inválido');
      err.errors = ['userId e movieId devem ser inteiros'];
      watchlistService.add.mockRejectedValue(err);

      const res = await request(app)
        .post('/watchlist')
        .send({ userId: 'abc', movieId: 10 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('deve retornar 500 em erro inesperado do service', async () => {
      watchlistService.add.mockRejectedValue(new Error('db crashed'));

      const res = await request(app)
        .post('/watchlist')
        .send({ userId: 5, movieId: 10 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'db crashed');
    });
  });

  describe('PUT /watchlist/:id/watched', () => {
    it('deve retornar 200 e o item atualizado', async () => {
      watchlistService.markAsWatched.mockResolvedValue({
        id: 3, userId: 5, movieId: 10, status: 'watched',
      });

      const res = await request(app).put('/watchlist/3/watched');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('watched');
      expect(watchlistService.markAsWatched).toHaveBeenCalledWith(3);
    });

    it('deve retornar 404 quando o item não existir', async () => {
      watchlistService.markAsWatched.mockResolvedValue(null);

      const res = await request(app).put('/watchlist/9999/watched');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /watchlist/:id', () => {
    it('deve retornar 204 ao remover com sucesso', async () => {
      watchlistService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/watchlist/3');

      expect(res.status).toBe(204);
      expect(watchlistService.remove).toHaveBeenCalledWith(3);
    });

    it('deve retornar 404 quando o item não existir', async () => {
      watchlistService.remove.mockResolvedValue(false);

      const res = await request(app).delete('/watchlist/9999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /watchlist/user/:userId', () => {
    it('deve retornar 200 e a lista do usuário', async () => {
      watchlistService.listByUser.mockResolvedValue([
        { id: 1, userId: 5, status: 'to_watch' },
        { id: 2, userId: 5, status: 'watched' },
      ]);

      const res = await request(app).get('/watchlist/user/5');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(watchlistService.listByUser).toHaveBeenCalledWith(5, undefined);
    });

    it('deve passar o filtro de status quando presente na query', async () => {
      watchlistService.listByUser.mockResolvedValue([
        { id: 2, userId: 5, status: 'watched' },
      ]);

      const res = await request(app).get('/watchlist/user/5?status=watched');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(watchlistService.listByUser).toHaveBeenCalledWith(5, 'watched');
    });

    it('deve retornar array vazio quando o usuário não tiver itens', async () => {
      watchlistService.listByUser.mockResolvedValue([]);

      const res = await request(app).get('/watchlist/user/999');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
