import { expect } from 'chai';
import { sequelize, User, Movie, Review } from '../../src/models/index.js';
import * as reviewService from '../../src/services/reviewService.js';

describe('Review + DB (integração - expect)', () => {
  let user;
  let movie;

  before(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Review.destroy({ where: {} });
    await Movie.destroy({ where: {} });
    await User.destroy({ where: {} });

    user = await User.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hash-falso',
    });
    movie = await Movie.create({
      title: 'Matrix',
      year: 1999,
    });
  });

  it('deve criar uma review associada a usuário e filme', async () => {
    const review = await reviewService.create({
      userId: user.id,
      movieId: movie.id,
      rating: 9,
      comment: 'Excelente filme',
    });

    expect(review).to.have.property('id');
    expect(review.userId).to.equal(user.id);
    expect(review.movieId).to.equal(movie.id);
    expect(review.rating).to.equal(9);
  });

  it('deve rejeitar rating fora da faixa 1-10', async () => {
    try {
      await reviewService.create({
        userId: user.id,
        movieId: movie.id,
        rating: 11,
      });
      expect.fail('deveria ter rejeitado rating inválido');
    } catch (err) {
      expect(err).to.be.an('error');
    }
  });

  it('deve calcular a média de ratings de um filme', async () => {
    await reviewService.create({ userId: user.id, movieId: movie.id, rating: 8 });
    const outroUser = await User.create({
      name: 'Maria',
      email: 'maria@example.com',
      password: 'hash',
    });
    await reviewService.create({ userId: outroUser.id, movieId: movie.id, rating: 10 });

    const avg = await reviewService.averageRating(movie.id);

    expect(avg).to.equal(9);
  });

  it('deve listar reviews de um filme com o usuário associado', async () => {
    await reviewService.create({
      userId: user.id,
      movieId: movie.id,
      rating: 7,
      comment: 'Bom',
    });

    const reviews = await reviewService.listByMovie(movie.id);

    expect(reviews).to.have.lengthOf(1);
    expect(reviews[0].User).to.not.be.null;
    expect(reviews[0].User.name).to.equal('João');
  });
});
