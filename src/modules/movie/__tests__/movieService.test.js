import { describe, it, expect, vi } from 'vitest';
import { Movie } from '../Movie.js';
import * as movieService from '../movieService.js';

describe('movieService (unit)', () => {
  describe('list', () => {
    it('deve chamar Movie.findAll e retornar a lista', async () => {
      const fake = [
        { id: 1, title: 'Matrix' },
        { id: 2, title: 'Inception' },
      ];
      const spy = vi.spyOn(Movie, 'findAll').mockResolvedValue(fake);

      const result = await movieService.list();

      expect(spy).toHaveBeenCalledOnce();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('title', 'Matrix');
    });

    it('deve retornar array vazio quando não há filmes', async () => {
      vi.spyOn(Movie, 'findAll').mockResolvedValue([]);

      const result = await movieService.list();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('deve chamar Movie.findByPk com o id correto', async () => {
      const spy = vi.spyOn(Movie, 'findByPk').mockResolvedValue({ id: 7, title: 'X' });

      const result = await movieService.getById(7);

      expect(spy).toHaveBeenCalledWith(7);
      expect(result).toHaveProperty('id', 7);
    });

    it('deve retornar null quando o filme não existir', async () => {
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(null);

      const result = await movieService.getById(9999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar um filme com dados válidos', async () => {
      const payload = { title: 'Matrix', director: 'Wachowski', year: 1999 };
      const created = { id: 1, ...payload };
      const spy = vi.spyOn(Movie, 'create').mockResolvedValue(created);

      const result = await movieService.create(payload);

      expect(spy).toHaveBeenCalledWith(payload);
      expect(result).toEqual(created);
    });

    it('deve lançar erro quando o título estiver vazio', async () => {
      const spy = vi.spyOn(Movie, 'create');

      await expect(
        movieService.create({ title: '', director: 'X', year: 2000 })
      ).rejects.toThrow(/inválidos/);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando o diretor estiver ausente', async () => {
      const spy = vi.spyOn(Movie, 'create');

      await expect(
        movieService.create({ title: 'Matrix', year: 1999 })
      ).rejects.toThrow(/inválidos/);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando o ano for menor que 1888', async () => {
      const spy = vi.spyOn(Movie, 'create');

      await expect(
        movieService.create({ title: 'Antigo', director: 'X', year: 1800 })
      ).rejects.toThrow(/inválidos/);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando o ano for maior que ano atual + 5', async () => {
      const spy = vi.spyOn(Movie, 'create');
      const futureYear = new Date().getFullYear() + 10;

      await expect(
        movieService.create({ title: 'Futuro', director: 'X', year: futureYear })
      ).rejects.toThrow(/inválidos/);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve anexar a lista de errors ao Error lançado', async () => {
      vi.spyOn(Movie, 'create');

      try {
        await movieService.create({});
        expect.unreachable('deveria ter lançado');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err).toHaveProperty('errors');
        expect(Array.isArray(err.errors)).toBe(true);
        expect(err.errors.length).toBeGreaterThan(0);
      }
    });

    it('deve propagar erros do Movie.create (ex: falha de banco)', async () => {
      vi.spyOn(Movie, 'create').mockRejectedValue(new Error('db down'));

      await expect(
        movieService.create({ title: 'Matrix', director: 'W', year: 1999 })
      ).rejects.toThrow('db down');
    });
  });

  describe('update', () => {
    it('deve atualizar e retornar o filme quando ele existir', async () => {
      const movie = {
        id: 1,
        title: 'Antigo',
        update: vi.fn().mockImplementation(function (data) {
          Object.assign(this, data);
          return Promise.resolve(this);
        }),
      };
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(movie);

      const result = await movieService.update(1, { title: 'Novo' });

      expect(movie.update).toHaveBeenCalledWith({ title: 'Novo' });
      expect(result).toBe(movie);
      expect(result.title).toBe('Novo');
    });

    it('deve retornar null quando o filme não existir', async () => {
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(null);

      const result = await movieService.update(9999, { title: 'X' });

      expect(result).toBeNull();
    });

    it('não deve chamar update quando o filme não existir', async () => {
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(null);
      const updateSpy = vi.fn();

      await movieService.update(9999, { title: 'X' });

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover e retornar true quando o filme existir', async () => {
      const movie = { destroy: vi.fn().mockResolvedValue() };
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(movie);

      const result = await movieService.remove(1);

      expect(movie.destroy).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it('deve retornar false quando o filme não existir', async () => {
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(null);

      const result = await movieService.remove(9999);

      expect(result).toBe(false);
    });

    it('não deve chamar destroy quando o filme não existir', async () => {
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(null);
      const destroySpy = vi.fn();

      await movieService.remove(9999);

      expect(destroySpy).not.toHaveBeenCalled();
    });

    it('deve propagar erro do destroy', async () => {
      const movie = {
        destroy: vi.fn().mockRejectedValue(new Error('constraint violation')),
      };
      vi.spyOn(Movie, 'findByPk').mockResolvedValue(movie);

      await expect(movieService.remove(1)).rejects.toThrow('constraint violation');
    });
  });
});
