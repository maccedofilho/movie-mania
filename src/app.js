import express from 'express';
import './models/index.js';

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
        <h1>Movie Mania</h1>
    </html>
  `);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
