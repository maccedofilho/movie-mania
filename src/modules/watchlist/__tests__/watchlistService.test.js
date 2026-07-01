import { describe, it, expect, vi } from 'vitest';
import { Watchlist } from '../Watchlist.js';
import * as watchlistService from '../watchlistService.js';

describe('watchlistService (unit)', () => {
  describe('add', () => {
    it('deve criar um item com status "to_watch"', async () => {
      const fake = { id: 1, userId: 5, movieId: 10, status: 'to_watch' };
      const spy = vi.spyOn(Watchlist, 'create').mockResolvedValue(fake);

      const result = await watchlistService.add(5, 10);

      expect(spy).toHaveBeenCalledWith({ userId: 5, movieId: 10, status: 'to_watch' });
      expect(result).toEqual(fake);
    });

    it('deve lançar erro quando userId não for inteiro', async () => {
      const spy = vi.spyOn(Watchlist, 'create');

      await expect(watchlistService.add('abc', 10)).rejects.toThrow(/inteiros/);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando movieId não for inteiro', async () => {
      const spy = vi.spyOn(Watchlist, 'create');

      await expect(watchlistService.add(5, null)).rejects.toThrow(/inteiros/);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve propagar erro de constraint unique do Sequelize', async () => {
      const err = new Error('duplicado');
      err.name = 'SequelizeUniqueConstraintError';
      vi.spyOn(Watchlist, 'create').mockRejectedValue(err);

      await expect(watchlistService.add(5, 10)).rejects.toThrow('duplicado');
    });
  });

  describe('getById', () => {
    it('deve chamar Watchlist.findByPk com o id correto', async () => {
      const spy = vi.spyOn(Watchlist, 'findByPk').mockResolvedValue({ id: 7 });

      const result = await watchlistService.getById(7);

      expect(spy).toHaveBeenCalledWith(7);
      expect(result).toHaveProperty('id', 7);
    });

    it('deve retornar null quando o item não existir', async () => {
      vi.spyOn(Watchlist, 'findByPk').mockResolvedValue(null);

      const result = await watchlistService.getById(9999);

      expect(result).toBeNull();
    });
  });

  describe('markAsWatched', () => {
    it('deve atualizar status para "watched" e definir watchedAt', async () => {
      const item = {
        id: 1,
        status: 'to_watch',
        update: vi.fn().mockImplementation(function (data) {
          Object.assign(this, data);
          return Promise.resolve(this);
        }),
      };
      vi.spyOn(Watchlist, 'findByPk').mockResolvedValue(item);

      const result = await watchlistService.markAsWatched(1);

      expect(item.update).toHaveBeenCalledOnce();
      const updateArgs = item.update.mock.calls[0][0];
      expect(updateArgs.status).toBe('watched');
      expect(updateArgs.watchedAt).toBeInstanceOf(Date);
      expect(result).toBe(item);
    });

    it('deve retornar null quando o item não existir', async () => {
      vi.spyOn(Watchlist, 'findByPk').mockResolvedValue(null);

      const result = await watchlistService.markAsWatched(9999);

      expect(result).toBeNull();
    });

    it('não deve chamar update quando o item não existir', async () => {
      vi.spyOn(Watchlist, 'findByPk').mockResolvedValue(null);
      const updateSpy = vi.fn();

      await watchlistService.markAsWatched(9999);

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover e retornar true quando o item existir', async () => {
      const item = { destroy: vi.fn().mockResolvedValue() };
      vi.spyOn(Watchlist, 'findByPk').mockResolvedValue(item);

      const result = await watchlistService.remove(1);

      expect(item.destroy).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it('deve retornar false quando o item não existir', async () => {
      vi.spyOn(Watchlist, 'findByPk').mockResolvedValue(null);

      const result = await watchlistService.remove(9999);

      expect(result).toBe(false);
    });
  });

  describe('listByUser', () => {
    it('deve listar todos os itens de um usuário sem filtrar status', async () => {
      const fake = [{ id: 1, userId: 5, status: 'to_watch' }];
      const spy = vi.spyOn(Watchlist, 'findAll').mockResolvedValue(fake);

      const result = await watchlistService.listByUser(5);

      expect(spy).toHaveBeenCalledWith({ where: { userId: 5 } });
      expect(result).toEqual(fake);
    });

    it('deve filtrar por status quando informado', async () => {
      const fake = [{ id: 2, userId: 5, status: 'watched' }];
      const spy = vi.spyOn(Watchlist, 'findAll').mockResolvedValue(fake);

      const result = await watchlistService.listByUser(5, 'watched');

      expect(spy).toHaveBeenCalledWith({ where: { userId: 5, status: 'watched' } });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('status', 'watched');
    });

    it('deve retornar array vazio quando o usuário não tiver itens', async () => {
      vi.spyOn(Watchlist, 'findAll').mockResolvedValue([]);

      const result = await watchlistService.listByUser(999);

      expect(result).toEqual([]);
    });
  });
});
