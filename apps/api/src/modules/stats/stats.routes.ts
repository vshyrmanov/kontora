import { statsQuerySchema } from '@kontora/contracts';
import { Router } from 'express';
import { getStats } from './stats.service.js';

export const statsRouter = Router();

statsRouter.get('/', async (req, res) => {
  res.json(await getStats(statsQuerySchema.parse(req.query)));
});
