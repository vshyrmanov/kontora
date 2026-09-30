import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { clientsRouter } from './modules/clients/clients.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';
import { pickupsRouter, visitsRouter } from './modules/visits/visits.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env().CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRouter);

  const api = express.Router();
  api.use(requireAuth);
  api.use('/dashboard', dashboardRouter);
  api.use('/clients', clientsRouter);
  api.use('/visits', visitsRouter);
  api.use('/pickups', pickupsRouter);
  api.use('/stats', statsRouter);
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
