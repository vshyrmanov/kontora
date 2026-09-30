import { loginSchema } from '@kontora/contracts';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { currentUser, requireAuth } from '../../middleware/auth.js';
import { getUser, login } from './auth.service.js';

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });

authRouter.post('/login', loginLimiter, async (req, res) => {
  res.json(await login(loginSchema.parse(req.body)));
});

authRouter.get('/me', requireAuth, async (_req, res) => {
  res.json(await getUser(currentUser(res.locals).id));
});
