import { expect } from 'chai';
import { sequelize, User, Movie, Like } from '../../src/models/index.js';
import * as likeService from '../../src/services/likeService.js';

describe('Like + DB (integração - expect)', () => {
  let user;
  let movie;

  before(async () => {
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

    expect(like).to.have.property('id');
    expect(like.userId).to.equal(user.id);
    expect(like.movieId).to.equal(movie.id);
  });

  it('deve impedir o mesmo usuário curtir o mesmo filme duas vezes', async () => {
    await likeService.like(user.id, movie.id);

    try {
      await likeService.like(user.id, movie.id);
      expect.fail('deveria ter rejeitado like duplicado');
    } catch (err) {
      expect(err).to.be.an('error');
    }
  });

  it('deve permitir descurtir um filme curtido', async () => {
    await likeService.like(user.id, movie.id);

    const removed = await likeService.unlike(user.id, movie.id);
    const count = await Like.count({ where: { userId: user.id, movieId: movie.id } });

    expect(removed).to.be.true;
    expect(count).to.equal(0);
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

    expect(total).to.equal(2);
  });
});
