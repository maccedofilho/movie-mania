import { Watchlist } from './Watchlist.js';

export async function add(userId, movieId) {
  if (!Number.isInteger(userId) || !Number.isInteger(movieId)) {
    const err = new Error('userId e movieId devem ser inteiros');
    err.errors = ['userId e movieId devem ser inteiros'];
    throw err;
  }
  return Watchlist.create({ userId, movieId, status: 'to_watch' });
}

export async function getById(id) {
  return Watchlist.findByPk(id);
}

export async function markAsWatched(id) {
  const item = await Watchlist.findByPk(id);
  if (!item) return null;
  await item.update({ status: 'watched', watchedAt: new Date() });
  return item;
}

export async function remove(id) {
  const item = await Watchlist.findByPk(id);
  if (!item) return false;
  await item.destroy();
  return true;
}

export async function listByUser(userId, status) {
  const where = { userId };
  if (status) where.status = status;
  return Watchlist.findAll({ where });
}
