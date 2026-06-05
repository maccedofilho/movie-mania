import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { sequelize, User, Movie, Like } from '../../src/database/setup.js';
import * as likeService from '../../src/modules/like/likeService.js';

describe('Like + DB (integração)', () => {
  let user;
  let movie;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Like.destroy({ where: {} });
    await Movie.destroy({ where: {} });
    await User.destroy({ where: {} });

    user = await User.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hash',
    });
    movie = await Movie.create({ title: 'Matrix', year: 1999 });
  });

  it('deve permitir um usuário curtir um filme', async () => {
    const like = await likeService.like(user.id, movie.id);

    expect(like).toHaveProperty('id');
    expect(like.userId).toBe(user.id);
    expect(like.movieId).toBe(movie.id);
  });

  it('deve impedir o mesmo usuário curtir o mesmo filme duas vezes', async () => {
    await likeService.like(user.id, movie.id);

    await expect(likeService.like(user.id, movie.id)).rejects.toThrow();
  });

  it('deve permitir descurtir um filme curtido', async () => {
    await likeService.like(user.id, movie.id);

    const removed = await likeService.unlike(user.id, movie.id);
    const count = await Like.count({ where: { userId: user.id, movieId: movie.id } });

    expect(removed).toBe(true);
    expect(count).toBe(0);
  });

  it('deve contar quantos likes um filme possui', async () => {
    const outroUser = await User.create({
      name: 'Maria',
      email: 'maria@example.com',
      password: 'hash',
    });
    await likeService.like(user.id, movie.id);
    await likeService.like(outroUser.id, movie.id);

    const total = await likeService.countByMovie(movie.id);

    expect(total).toBe(2);
  });
});
