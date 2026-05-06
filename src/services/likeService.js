import { Like } from '../models/Like.js';

export async function like(userId, movieId) {
  return Like.create({ userId, movieId });
}

export async function unlike(userId, movieId) {
  const removed = await Like.destroy({ where: { userId, movieId } });
  return removed > 0;
}

export async function countByMovie(movieId) {
  return Like.count({ where: { movieId } });
}
