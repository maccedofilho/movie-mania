import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { sequelize, Movie, Genre } from '../../src/database/setup.js';
import * as movieService from '../../src/modules/movie/movieService.js';

describe('Movie + DB (integração)', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Movie.destroy({ where: {} });
    await Genre.destroy({ where: {} });
  });

  it('deve persistir um filme no banco de dados', async () => {
    const created = await movieService.create({
      title: 'Matrix',
      director: 'Wachowski',
      year: 1999,
    });

    const found = await Movie.findByPk(created.id);

    expect(found).not.toBeNull();
    expect(found.title).toBe('Matrix');
    expect(found.director).toBe('Wachowski');
    expect(found.year).toBe(1999);
  });

  it('deve listar todos os filmes persistidos', async () => {
    await movieService.create({ title: 'A', director: 'X', year: 2000 });
    await movieService.create({ title: 'B', director: 'Y', year: 2001 });
    await movieService.create({ title: 'C', director: 'Z', year: 2002 });

    const all = await movieService.list();

    expect(all).toHaveLength(3);
  });

  it('deve buscar um filme por id no banco', async () => {
    const created = await movieService.create({
      title: 'Interestelar',
      director: 'Nolan',
      year: 2014,
    });

    const found = await movieService.getById(created.id);

    expect(found).not.toBeNull();
    expect(found.title).toBe('Interestelar');
  });

  it('deve atualizar um filme existente', async () => {
    const created = await movieService.create({
      title: 'Antigo',
      director: 'X',
      year: 2000,
    });

    const updated = await movieService.update(created.id, { title: 'Novo' });

    expect(updated.title).toBe('Novo');

    const reloaded = await Movie.findByPk(created.id);
    expect(reloaded.title).toBe('Novo');
  });

  it('deve remover um filme do banco', async () => {
    const created = await movieService.create({
      title: 'Descartável',
      director: 'X',
      year: 2010,
    });

    const removed = await movieService.remove(created.id);
    const found = await Movie.findByPk(created.id);

    expect(removed).toBe(true);
    expect(found).toBeNull();
  });

  it('deve associar um filme a um gênero', async () => {
    const genre = await Genre.create({ name: 'Ficção Científica' });
    const movie = await movieService.create({
      title: 'Matrix',
      director: 'Wachowski',
      year: 1999,
      genreId: genre.id,
    });

    const withGenre = await Movie.findByPk(movie.id, { include: Genre });

    expect(withGenre.Genre).not.toBeNull();
    expect(withGenre.Genre.name).toBe('Ficção Científica');
  });
});
