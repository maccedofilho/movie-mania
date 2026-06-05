import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { sequelize, User, Movie, Review } from '../../src/database/setup.js';
import * as reviewService from '../../src/modules/review/reviewService.js';

describe('Review + DB (integração)', () => {
  let user;
  let movie;

  beforeAll(async () => {
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

    expect(review).toHaveProperty('id');
    expect(review.userId).toBe(user.id);
    expect(review.movieId).toBe(movie.id);
    expect(review.rating).toBe(9);
  });

  it('deve rejeitar rating fora da faixa 1-10', async () => {
    await expect(
      reviewService.create({
        userId: user.id,
        movieId: movie.id,
        rating: 11,
      })
    ).rejects.toThrow();
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

    expect(avg).toBe(9);
  });

  it('deve listar reviews de um filme com o usuário associado', async () => {
    await reviewService.create({
      userId: user.id,
      movieId: movie.id,
      rating: 7,
      comment: 'Bom',
    });

    const reviews = await reviewService.listByMovie(movie.id);

    expect(reviews).toHaveLength(1);
    expect(reviews[0].User).not.toBeNull();
    expect(reviews[0].User.name).toBe('João');
  });
});
