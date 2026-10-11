import express from 'express';
import { authRouter } from './routes/auth.ts';
import { apiRouter } from './routes/api.ts';

export function createApp() {
  const app = express();

  // Permissive CORS middleware for cross-origin or serverless invocations
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // Log API requests
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/v1') || req.url.startsWith('/auth')) {
      console.log(`[RestaurantOS ${req.method}] ${req.url}`);
    }
    next();
  });

  // Health endpoint
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      platform: 'RestaurantOS',
      engine: 'Enterprise AI & Kirana POS',
    });
  };
  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);

  // Mount Auth Router across multiple path prefixes for Vercel Serverless & Express flexibility
  app.use('/api/v1/auth', authRouter);
  app.use('/v1/auth', authRouter);
  app.use('/auth', authRouter);

  // Mount Main API Router across multiple path prefixes
  app.use('/api/v1', apiRouter);
  app.use('/v1', apiRouter);
  app.use('/api', apiRouter);

  return app;
}

export const app = createApp();
export default app;
