import { expect } from 'chai';
import { sequelize, Movie, Genre } from '../../src/models/index.js';
import * as movieService from '../../src/services/movieService.js';

describe('Movie + DB (integração - expect)', () => {
  before(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Movie.destroy({ where: {} });
    await Genre.destroy({ where: {} });
  });

  after(async () => {
    await sequelize.close();
  });

  it('deve persistir um filme no banco de dados', async () => {
    const created = await movieService.create({
      title: 'Matrix',
      director: 'Wachowski',
      year: 1999,
    });

    const found = await Movie.findByPk(created.id);

    expect(found).to.not.be.null;
    expect(found.title).to.equal('Matrix');
    expect(found.director).to.equal('Wachowski');
    expect(found.year).to.equal(1999);
  });

  it('deve listar todos os filmes persistidos', async () => {
    await movieService.create({ title: 'A', director: 'X', year: 2000 });
    await movieService.create({ title: 'B', director: 'Y', year: 2001 });
    await movieService.create({ title: 'C', director: 'Z', year: 2002 });

    const all = await movieService.list();

    expect(all).to.have.lengthOf(3);
  });

  it('deve buscar um filme por id no banco', async () => {
    const created = await movieService.create({
      title: 'Interestelar',
      director: 'Nolan',
      year: 2014,
    });

    const found = await movieService.getById(created.id);

    expect(found).to.not.be.null;
    expect(found.title).to.equal('Interestelar');
  });

  it('deve atualizar um filme existente', async () => {
    const created = await movieService.create({
      title: 'Antigo',
      director: 'X',
      year: 2000,
    });

    const updated = await movieService.update(created.id, { title: 'Novo' });

    expect(updated.title).to.equal('Novo');

    const reloaded = await Movie.findByPk(created.id);
    expect(reloaded.title).to.equal('Novo');
  });

  it('deve remover um filme do banco', async () => {
    const created = await movieService.create({
      title: 'Descartável',
      director: 'X',
      year: 2010,
    });

    const removed = await movieService.remove(created.id);
    const found = await Movie.findByPk(created.id);

    expect(removed).to.be.true;
    expect(found).to.be.null;
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

    expect(withGenre.Genre).to.not.be.null;
    expect(withGenre.Genre.name).to.equal('Ficção Científica');
  });
});
