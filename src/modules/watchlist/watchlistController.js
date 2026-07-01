import * as watchlistService from './watchlistService.js';

export async function add(req, res) {
  const { userId, movieId } = req.body;
  if (userId == null || movieId == null) {
    return res.status(400).json({ errors: ['userId e movieId são obrigatórios'] });
  }
  try {
    const item = await watchlistService.add(Number(userId), Number(movieId));
    return res.status(201).json(item);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'filme já está na watchlist' });
    }
    if (err.errors) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function markAsWatched(req, res) {
  const item = await watchlistService.markAsWatched(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'item não encontrado' });
  return res.status(200).json(item);
}

export async function remove(req, res) {
  const ok = await watchlistService.remove(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'item não encontrado' });
  return res.status(204).send();
}

export async function listByUser(req, res) {
  const userId = Number(req.params.userId);
  const status = req.query.status;
  const items = await watchlistService.listByUser(userId, status);
  return res.status(200).json(items);
}
