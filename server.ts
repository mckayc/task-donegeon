import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createRequire } from 'module';
import express, { Request, Response, NextFunction } from 'express';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { app, initializeApp } = require('./backend/server.js');

async function start() {
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  await initializeApp();

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const buildPath = path.resolve(__dirname, 'dist');

    // Never cache sw.js so the browser discovers updates immediately
    app.get('/sw.js', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(buildPath, 'sw.js'));
    });

    // Static assets (hashed bundles can be cached; HTML must not be)
    app.use(express.static(buildPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));

    // Fallback for SPA navigation: index.html must never be cached
    app.use((_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack || err);
    res.status(500).send({ error: 'Something went wrong!' });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Task Donegeon server running on http://0.0.0.0:${port} [${isProd ? 'production' : 'development'}]`);
  });
}

start().catch((err: any) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
