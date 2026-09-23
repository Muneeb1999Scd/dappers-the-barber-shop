import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes.js';
import { getDb } from './src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json());

  // Initialize DB
  await getDb();
  console.log('[Dappers] SQLite Database initialized with schema and seed data.');

  // Mount API routes
  app.use('/api', apiRouter);

  // Serve generated images directory statically
  app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dappers Server] Serving on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Dappers Server] Fatal error starting server:', err);
  process.exit(1);
});
