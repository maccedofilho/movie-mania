import * as movieService from './movieService.js';

export async function list(req, res) {
  const movies = await movieService.list();
  res.status(200).json(movies);
}

export async function getById(req, res) {
  const movie = await movieService.getById(req.params.id);
  if (!movie) return res.status(404).json({ error: 'filme não encontrado' });
  res.status(200).json(movie);
}

export async function create(req, res) {
  try {
    const movie = await movieService.create(req.body);
    res.status(201).json(movie);
  } catch (err) {
    if (err.errors) return res.status(400).json({ errors: err.errors });
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  const movie = await movieService.update(req.params.id, req.body);
  if (!movie) return res.status(404).json({ error: 'filme não encontrado' });
  res.status(200).json(movie);
}

export async function remove(req, res) {
  const ok = await movieService.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'filme não encontrado' });
  res.status(204).send();
}
