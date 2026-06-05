import { Movie } from './Movie.js';
import { validateMovie } from './movieValidator.js';

export async function list() {
  return Movie.findAll();
}

export async function getById(id) {
  return Movie.findByPk(id);
}

export async function create(data) {
  const { valid, errors } = validateMovie(data);
  if (!valid) {
    const err = new Error(`dados inválidos: ${errors.join(', ')}`);
    err.errors = errors;
    throw err;
  }
  return Movie.create(data);
}

export async function update(id, data) {
  const movie = await Movie.findByPk(id);
  if (!movie) return null;
  await movie.update(data);
  return movie;
}

export async function remove(id) {
  const movie = await Movie.findByPk(id);
  if (!movie) return false;
  await movie.destroy();
  return true;
}
