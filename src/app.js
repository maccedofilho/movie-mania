import express from 'express';
import './database/setup.js';
import movieRoutes from './modules/movie/movieRoutes.js';
import watchlistRoutes from './modules/watchlist/watchlistRoutes.js';

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/movies', movieRoutes);
app.use('/watchlist', watchlistRoutes);

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
