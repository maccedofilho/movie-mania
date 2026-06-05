import { Review } from './Review.js';
import { User } from '../user/User.js';

export async function create(data) {
  return Review.create(data);
}

export async function averageRating(movieId) {
  const reviews = await Review.findAll({ where: { movieId } });
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return total / reviews.length;
}

export async function listByMovie(movieId) {
  return Review.findAll({
    where: { movieId },
    include: User,
  });
}
